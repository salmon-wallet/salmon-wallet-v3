/**
 * Solana Swap Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-swap-service.js
 *
 * Provides functionality for token swaps on Solana using the Salmon API.
 * This is the blockchain-level service that handles transaction signing and confirmation.
 * API functions are injected via parameters to decouple from api/services/.
 *
 * Features:
 * - Get swap quotes with transaction data
 * - Execute signed swap transactions
 * - Transaction confirmation
 * - Automatic decimal handling
 * - Proper handling of SOL native token address
 */

import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import type {
  SwapOrderResponse,
  SwapOrderParams,
  SolanaNetworkId,
  ApiSwapExecuteResponse,
} from '../../api/services/solana';
import type { TokenMetadata } from '../../api/services/tokens';
import { applyDecimals, SOL_ADDRESS } from './transfer';
import type { SolanaNetwork } from './SolanaAccount';

// ============================================================================
// Types
// ============================================================================

/**
 * Network identifier for swap operations
 */
export type SwapNetworkId = SolanaNetworkId;

/**
 * Parameters for requesting a swap quote (high-level, with human-readable amounts)
 */
export interface SwapQuoteParams {
  /** Input token mint address (use SOL_ADDRESS for native SOL) */
  inputMint: string;
  /** Output token mint address (use SOL_ADDRESS for native SOL) */
  outputMint: string;
  /** Amount to swap in human-readable format (will be converted using decimals) */
  amount: number;
  /** Public key of the wallet performing the swap */
  publicKey: string;
  /** Slippage tolerance in basis points (optional, default: 50 = 0.5%) */
  slippageBps?: number;
  /** Swap mode (optional, default: 'ExactIn') */
  swapMode?: 'ExactIn' | 'ExactOut';
  /** Use dynamic slippage (optional) */
  dynamicSlippage?: boolean;
  /** Priority fee level (optional) */
  priorityLevel?: 'none' | 'low' | 'medium' | 'high' | 'veryHigh';
}

/**
 * Swap quote response - wraps the API response with additional context
 */
export interface SwapQuote extends SwapOrderResponse {
  /** Network ID used for this quote */
  networkId: SwapNetworkId;
}

/**
 * Result of a swap operation
 */
export interface SwapResult {
  /** Transaction ID (signature) */
  txId: string | null;
  /** Swap status */
  status: 'success' | 'fail';
  /** Error message if swap failed */
  error?: string;
  /** Confirmation status from the network */
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Options for swap quote request
 */
export interface GetSwapQuoteOptions {
  /** Token decimals (if known, avoids token list lookup) */
  inputDecimals?: number;
}

// ============================================================================
// API Function Types
// ============================================================================

export type GetSwapOrderFn = (
  networkId: SolanaNetworkId,
  params: SwapOrderParams
) => Promise<SwapOrderResponse | null>;

export type ExecuteSwapApiFn = (
  networkId: SolanaNetworkId,
  signedTransaction: string,
  requestId: string
) => Promise<ApiSwapExecuteResponse>;

export type GetTokenListFn = (
  networkId: SolanaNetworkId
) => Promise<TokenMetadata[]>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes a token address, handling the special case where the user's
 * public key might be passed instead of SOL_ADDRESS for native SOL
 *
 * @param address - Token address or user public key
 * @param userPublicKey - User's public key
 * @returns Normalized token address
 */
function normalizeTokenAddress(address: string, userPublicKey: string): string {
  // If the address matches the user's public key, it's native SOL
  return address === userPublicKey ? SOL_ADDRESS : address;
}

/**
 * Gets the decimals for a token from the token list
 *
 * @param tokenAddress - Token mint address
 * @param networkId - Network identifier
 * @returns Token decimals or 9 for SOL
 */
async function getTokenDecimals(
  tokenAddress: string,
  networkId: SwapNetworkId = 'solana-mainnet',
  fetchTokenList: GetTokenListFn = () => Promise.resolve([])
): Promise<number> {
  // SOL has 9 decimals
  if (tokenAddress === SOL_ADDRESS) {
    return 9;
  }

  try {
    const tokens = await fetchTokenList(networkId);
    const token = tokens.find((t: TokenMetadata) => t.address === tokenAddress);
    return token?.decimals ?? 9;
  } catch {
    // Default to 9 decimals if token list lookup fails
    return 9;
  }
}

// ============================================================================
// Swap Functions
// ============================================================================

/**
 * Gets a swap quote from the API
 *
 * Fetches a quote for swapping tokens, including the pre-built transaction
 * that needs to be signed and submitted. This function handles decimal
 * conversion automatically.
 *
 * @param network - Solana network configuration or network ID string
 * @param params - Swap quote parameters (with human-readable amount)
 * @param options - Optional configuration
 * @returns Swap quote with transaction data
 *
 * @example
 * ```typescript
 * const quote = await getSwapQuote(
 *   { id: 'solana-mainnet', ... },
 *   {
 *     inputMint: 'So11111111111111111111111111111111111111112', // SOL
 *     outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
 *     amount: 1.5, // 1.5 SOL (human-readable)
 *     publicKey: 'YourPublicKey...',
 *     slippageBps: 50, // 0.5%
 *   }
 * );
 * ```
 */
export async function getSwapQuote(
  network: SolanaNetwork | { id: string } | SwapNetworkId,
  params: SwapQuoteParams,
  options: GetSwapQuoteOptions = {},
  fetchSwapOrder: GetSwapOrderFn,
  fetchTokenList: GetTokenListFn = () => Promise.resolve([])
): Promise<SwapQuote> {
  const networkId = typeof network === 'string' ? network : network.id as SwapNetworkId;
  const { inputMint, outputMint, amount, publicKey, slippageBps, swapMode, dynamicSlippage, priorityLevel } = params;

  // Normalize addresses (handle case where publicKey is passed instead of SOL_ADDRESS)
  const normalizedInputMint = normalizeTokenAddress(inputMint, publicKey);
  const normalizedOutputMint = normalizeTokenAddress(outputMint, publicKey);

  // Get input token decimals
  const decimals = options.inputDecimals ?? await getTokenDecimals(
    normalizedInputMint,
    networkId,
    fetchTokenList
  );

  // Convert amount to raw units (string for API)
  const rawAmount = applyDecimals(amount, decimals).toString();

  // Build API request parameters
  const apiParams: SwapOrderParams = {
    inputMint: normalizedInputMint,
    outputMint: normalizedOutputMint,
    amount: rawAmount,
    publicKey,
    slippageBps,
    swapMode,
    dynamicSlippage,
    priorityLevel,
  };

  const response = await fetchSwapOrder(networkId, apiParams);

  if (!response) {
    throw new Error('Failed to get swap quote: No route found');
  }

  return {
    ...response,
    networkId,
  };
}

/**
 * Executes a swap using a signed transaction
 *
 * Takes a swap quote, signs the transaction with the provided keypair,
 * and submits it to the API for execution. Optionally waits for transaction
 * confirmation on-chain.
 *
 * @param quote - Swap quote from getSwapQuote
 * @param keypair - Keypair to sign the transaction
 * @param connection - Optional Solana connection for additional confirmation
 * @returns Swap result with transaction ID and status
 *
 * @example
 * ```typescript
 * const quote = await getSwapQuote(network, params);
 * const result = await executeSwap(quote, keypair);
 *
 * if (result.status === 'success') {
 *   console.log('Swap successful:', result.txId);
 * } else {
 *   console.error('Swap failed:', result.error);
 * }
 * ```
 */
export async function executeSwap(
  quote: SwapQuote,
  keypair: Keypair,
  connection: Connection | undefined,
  submitSwap: ExecuteSwapApiFn
): Promise<SwapResult> {
  try {
    // Deserialize the transaction from the quote (Jupiter Ultra v1: custom.transaction)
    const transaction64 = quote.custom?.transaction;
    if (!transaction64) {
      throw new Error('No transaction found in quote');
    }
    const transactionBuffer = Buffer.from(transaction64, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Sign the transaction
    transaction.sign([keypair]);

    // Serialize the signed transaction back to base64
    const signedTransactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

    // Submit to the API
    const requestId = quote.custom?.requestId || '';
    const response = await submitSwap(
      quote.networkId,
      signedTransactionBase64,
      requestId
    );

    // Handle API response
    if (response.status === 'Success' && response.signature) {
      // If a connection is provided, do additional on-chain confirmation
      if (connection) {
        try {
          const confirmation = await connection.confirmTransaction(
            response.signature,
            'confirmed'
          );

          if (confirmation?.value?.err) {
            return {
              txId: response.signature,
              status: 'fail',
              error: String(confirmation.value.err),
              confirmationStatus: response.confirmationStatus,
            };
          }
        } catch {
          // Confirmation timed out but transaction may still succeed
          // Return success since API confirmed it
        }
      }

      return {
        txId: response.signature,
        status: 'success',
        confirmationStatus: response.confirmationStatus,
      };
    }

    // Handle failure
    return {
      txId: response.signature || null,
      status: 'fail',
      error: response.error || 'Swap execution failed',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during swap execution';
    return {
      txId: null,
      status: 'fail',
      error: errorMessage,
    };
  }
}

/**
 * Gets a swap quote and executes it in one call
 *
 * Convenience function that combines getSwapQuote and executeSwap.
 * Useful for simple swap operations where you don't need to inspect
 * the quote before executing.
 *
 * @param network - Solana network configuration or network ID
 * @param params - Swap quote parameters
 * @param keypair - Keypair to sign the transaction
 * @param connection - Optional Solana connection for confirmation
 * @returns Swap result with transaction ID and status
 *
 * @example
 * ```typescript
 * const result = await swap(
 *   'solana-mainnet',
 *   {
 *     inputMint: SOL_ADDRESS,
 *     outputMint: 'USDC_MINT_ADDRESS',
 *     amount: 1.0,
 *     publicKey: keypair.publicKey.toBase58(),
 *   },
 *   keypair,
 *   connection
 * );
 * ```
 */
export async function swap(
  network: SolanaNetwork | { id: string } | SwapNetworkId,
  params: SwapQuoteParams,
  keypair: Keypair,
  connection: Connection | undefined,
  fetchSwapOrder: GetSwapOrderFn,
  submitSwap: ExecuteSwapApiFn,
  fetchTokenList: GetTokenListFn = () => Promise.resolve([])
): Promise<SwapResult> {
  const quote = await getSwapQuote(network, params, {}, fetchSwapOrder, fetchTokenList);
  return executeSwap(quote, keypair, connection, submitSwap);
}

/**
 * Calculates the expected output amount from a swap quote
 *
 * @param quote - Swap quote
 * @param outputDecimals - Decimals for the output token (optional, uses quote info if available)
 * @returns Human-readable output amount
 */
export function getExpectedOutput(quote: SwapQuote, outputDecimals?: number): number {
  const decimals = outputDecimals ?? quote.output?.decimals ?? 9;
  const amount = quote.output?.amount || '0';
  return Number(amount) / (10 ** decimals);
}

/**
 * Calculates the minimum output amount (accounting for slippage) from a swap quote
 *
 * @param quote - Swap quote
 * @param outputDecimals - Decimals for the output token (optional, uses quote info if available)
 * @returns Human-readable minimum output amount
 */
export function getMinimumOutput(quote: SwapQuote, outputDecimals?: number): number {
  const decimals = outputDecimals ?? quote.output?.decimals ?? 9;
  const threshold = quote.custom?.otherAmountThreshold || '0';
  return Number(threshold) / (10 ** decimals);
}

/**
 * Gets the price impact percentage from a swap quote
 *
 * @param quote - Swap quote
 * @returns Price impact as a percentage (e.g., 0.12 for 0.12%)
 */
export function getPriceImpact(quote: SwapQuote): number {
  return quote.custom?.priceImpact || 0;
}

// Re-export SOL_ADDRESS for convenience
export { SOL_ADDRESS };
