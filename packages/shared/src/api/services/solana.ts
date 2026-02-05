/**
 * Solana API Service
 * Handles all backend communication for Solana-specific operations.
 *
 * API Endpoints:
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 * - GET /v1/{networkId}/account/{address}/transactions/{txId} - Get single transaction
 * - GET /v1/{networkId}/ft/swap/order - Get swap quote
 * - POST /v1/{networkId}/ft/swap/execute - Execute swap
 *
 * Note: Token list endpoints (verified, top, batch, search) are in tokens.ts
 */

import { apiClient, ApiError } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Solana network identifier
 */
export type SolanaNetworkId = 'solana-mainnet' | 'solana-devnet';

// ----------------------------------------------------------------------------
// Transaction Types
// ----------------------------------------------------------------------------

/**
 * Token transfer within a transaction
 */
export interface SolanaTokenTransfer {
  /** Source address */
  fromAddress: string;
  /** Destination address */
  toAddress: string;
  /** Token mint address */
  mint: string;
  /** Transfer amount (raw, without decimals) */
  amount: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol (if available) */
  symbol?: string;
  /** Token name (if available) */
  name?: string;
  /** Token logo URL (if available) */
  logo?: string | null;
}

/**
 * Native SOL transfer within a transaction
 */
export interface SolanaNativeTransfer {
  /** Source address */
  fromAddress: string;
  /** Destination address */
  toAddress: string;
  /** Transfer amount in lamports */
  amount: number;
}

/**
 * Account data change in a transaction
 */
export interface SolanaAccountData {
  /** Account address */
  account: string;
  /** Native balance change in lamports */
  nativeBalanceChange: number;
  /** Token balance changes */
  tokenBalanceChanges: Array<{
    mint: string;
    rawTokenAmount: {
      tokenAmount: string;
      decimals: number;
    };
    userAccount: string;
  }>;
}

/**
 * Instruction within a transaction
 */
export interface SolanaInstruction {
  /** Program ID that owns the instruction */
  programId: string;
  /** Accounts involved in the instruction */
  accounts: string[];
  /** Instruction data (base58 encoded) */
  data: string;
  /** Inner instructions (for CPI calls) */
  innerInstructions?: SolanaInstruction[];
}

/**
 * Transaction status (RPC format - uppercase)
 * @deprecated Use SolanaTransactionStatusBackend instead (lowercase from backend)
 */
export type SolanaTransactionStatus = 'confirmed' | 'finalized' | 'failed';

/**
 * Transaction type classification (Helius format - uppercase)
 * Used for filtering API requests
 */
export type SolanaTransactionType =
  | 'TRANSFER'
  | 'SWAP'
  | 'NFT_SALE'
  | 'NFT_LISTING'
  | 'NFT_CANCEL_LISTING'
  | 'NFT_BID'
  | 'NFT_CANCEL_BID'
  | 'NFT_MINT'
  | 'NFT_BURN'
  | 'TOKEN_MINT'
  | 'TOKEN_BURN'
  | 'STAKE'
  | 'UNSTAKE'
  | 'COMPRESSED_NFT_MINT'
  | 'COMPRESSED_NFT_TRANSFER'
  | 'UNKNOWN';

/**
 * Token amount in a transaction (from backend)
 */
export interface SolanaTransactionTokenAmount {
  /** Raw amount (in smallest unit) */
  amount: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name?: string;
  /** Token logo URL */
  logo?: string | null;
  /** Token contract/mint address */
  contract: string;
  /** Source address (for receives) */
  source?: string;
  /** Destination address (for sends) */
  destination?: string;
  /** Whether this is an NFT */
  isNft?: boolean;
}

/**
 * Transaction fee information (from backend)
 */
export interface SolanaTransactionFee {
  /** Fee amount in lamports */
  amount: number;
  /** Fee decimals */
  decimals: number;
  /** Fee token symbol */
  symbol: string;
}

/**
 * Transaction status from backend (lowercase)
 */
export type SolanaTransactionStatusBackend = 'completed' | 'failed' | 'pending';

/**
 * Transaction type from backend (lowercase)
 */
export type SolanaTransactionTypeBackend =
  | 'send'
  | 'receive'
  | 'swap'
  | 'mint'
  | 'burn'
  | 'stake'
  | 'loan'
  | 'interaction'
  | 'unknown';

/**
 * Solana transaction from the API (backend-transformed format)
 *
 * Note: The backend returns transactions already transformed to UI format.
 * This differs from raw Helius format (which has nativeTransfers/tokenTransfers).
 */
export interface SolanaTransaction {
  /** Wallet address */
  address?: string;
  /** Transaction signature (unique identifier) */
  signature: string;
  /** Transaction ID (same as signature) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status (lowercase from backend) */
  status: SolanaTransactionStatusBackend;
  /** Transaction fee (null if user didn't pay fee) */
  fee?: SolanaTransactionFee | null;
  /** Transaction type (lowercase from backend) */
  type: SolanaTransactionTypeBackend;
  /** Tokens received */
  inputs: SolanaTransactionTokenAmount[];
  /** Tokens sent */
  outputs: SolanaTransactionTokenAmount[];
  /** Human-readable description from Helius */
  description?: string;
  /** Source protocol (e.g., 'JUPITER', 'MAGIC_EDEN', 'PHANTOM') */
  source?: string;
  /** Transaction events */
  events?: Record<string, unknown>;
  /** Original Helius transaction type (uppercase) */
  heliusType?: string;
}

/**
 * Pagination parameters for transaction queries
 */
export interface SolanaPagingParams {
  /** Page token for cursor-based pagination (from previous response's oldestSignature) */
  pageToken?: string;
  /** Number of items per page (max 100) */
  pageSize?: number;
  /** Transaction type filter */
  type?: SolanaTransactionType;
  // Legacy aliases for backwards compatibility
  /** @deprecated Use pageToken instead */
  before?: string;
  /** @deprecated Use pageSize instead */
  limit?: number;
}

/**
 * Paginated transaction response
 */
export interface SolanaTransactionsResponse {
  /** Array of transactions */
  transactions: SolanaTransaction[];
  /** Signature of the oldest transaction (use as 'before' for next page) */
  oldestSignature?: string | null;
  /** Whether there are more transactions to fetch */
  hasMore: boolean;
}

// ----------------------------------------------------------------------------
// Swap Types
// ----------------------------------------------------------------------------

/**
 * Swap route info (simplified from Jupiter)
 */
export interface SwapRouteInfo {
  /** Input token mint address */
  inputMint: string;
  /** Output token mint address */
  outputMint: string;
  /** Input amount (raw, with decimals) */
  inAmount: string;
  /** Output amount (raw, with decimals) */
  outAmount: string;
  /** Other amount threshold (minimum received or maximum sent) */
  otherAmountThreshold: string;
  /** Swap mode ('ExactIn' or 'ExactOut') */
  swapMode: 'ExactIn' | 'ExactOut';
  /** Slippage in basis points */
  slippageBps: number;
  /** Price impact percentage (as string, e.g., '0.12') */
  priceImpactPct: string;
  /** Route plan details */
  routePlan: Array<{
    /** Swap info for this leg */
    swapInfo: {
      /** AMM key */
      ammKey: string;
      /** AMM label (e.g., 'Raydium', 'Orca') */
      label: string;
      /** Input mint for this leg */
      inputMint: string;
      /** Output mint for this leg */
      outputMint: string;
      /** Input amount for this leg */
      inAmount: string;
      /** Output amount for this leg */
      outAmount: string;
      /** Fee amount */
      feeAmount: string;
      /** Fee mint */
      feeMint: string;
    };
    /** Percentage of input routed through this leg */
    percent: number;
  }>;
  /** Context slot for quote validity */
  contextSlot?: number;
  /** Time taken to compute the quote (ms) */
  timeTaken?: number;
}

/**
 * Swap order/quote response from the API
 */
export interface SwapOrderResponse {
  /** Unique request ID for executing the swap */
  requestId: string;
  /** Route information */
  route: SwapRouteInfo;
  /** Serialized transaction (base64 encoded) */
  swapTransaction: string;
  /** Token info for input token */
  inputToken?: {
    symbol: string;
    name: string;
    decimals: number;
    logo?: string | null;
  };
  /** Token info for output token */
  outputToken?: {
    symbol: string;
    name: string;
    decimals: number;
    logo?: string | null;
  };
  /** Expiration time (Unix timestamp) */
  expiresAt?: number;
}

/**
 * Parameters for requesting a swap quote
 */
export interface SwapOrderParams {
  /** Input token mint address */
  inputMint: string;
  /** Output token mint address */
  outputMint: string;
  /** Amount to swap (raw, with decimals) */
  amount: string;
  /** User's public key */
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
 * Request body for executing a swap
 */
export interface SwapExecuteRequest {
  /** Signed transaction (base64 encoded) */
  signedTransaction: string;
  /** Request ID from the quote response */
  requestId: string;
}

/**
 * Response from executing a swap via API
 */
export interface ApiSwapExecuteResponse {
  /** Transaction signature */
  signature: string;
  /** Whether the swap was successful */
  success: boolean;
  /** Error message if swap failed */
  error?: string;
  /** Confirmation status */
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
}

// ============================================================================
// API Functions - Transactions
// ============================================================================

/**
 * Get paginated transactions for an address
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param paging - Optional pagination parameters
 * @returns Paginated transaction response
 */
export async function getSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  paging?: SolanaPagingParams
): Promise<SolanaTransactionsResponse> {
  try {
    const params: Record<string, string | number> = {};

    // Use pageToken/pageSize (new) or before/limit (legacy)
    const pageToken = paging?.pageToken || paging?.before;
    const pageSize = paging?.pageSize || paging?.limit;

    if (pageToken) {
      params.pageToken = pageToken;
    }
    if (pageSize) {
      params.pageSize = pageSize;
    }
    if (paging?.type) {
      params.type = paging.type;
    }

    // Backend returns { data: Transaction[], meta: { nextPageToken?: string } }
    interface BackendResponse {
      data: SolanaTransaction[];
      meta?: { nextPageToken?: string };
    }

    const { data: response } = await apiClient.get<BackendResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { params }
    );

    const transactions = response.data || [];
    const nextPageToken = response.meta?.nextPageToken;

    return {
      transactions,
      oldestSignature: nextPageToken || null,
      hasMore: !!nextPageToken,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return { transactions: [], oldestSignature: null, hasMore: false };
    }
    console.error('[SolanaService] Failed to get transactions:', error);
    throw error;
  }
}

/**
 * Get a single transaction by signature
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions/{txId}
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param signature - Transaction signature
 * @returns Transaction data, or null if not found
 */
export async function getSolanaTransaction(
  networkId: SolanaNetworkId,
  address: string,
  signature: string
): Promise<SolanaTransaction | null> {
  try {
    const { data } = await apiClient.get<SolanaTransaction>(
      `/v1/${networkId}/account/${address}/transactions/${signature}`
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[SolanaService] Failed to get transaction:', error);
    throw error;
  }
}

// ============================================================================
// API Functions - Swap
// ============================================================================

/**
 * Get a swap quote/order
 *
 * Endpoint: GET /v1/{networkId}/ft/swap/order
 *
 * This endpoint returns a quote and a serialized transaction ready to be signed.
 * The transaction is valid for a limited time (check expiresAt).
 *
 * @param networkId - Solana network identifier
 * @param params - Swap parameters
 * @returns Swap order with route info and unsigned transaction
 */
export async function getSwapOrder(
  networkId: SolanaNetworkId,
  params: SwapOrderParams
): Promise<SwapOrderResponse | null> {
  try {
    const queryParams: Record<string, string | number | boolean> = {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      publicKey: params.publicKey,
    };

    if (params.slippageBps !== undefined) {
      queryParams.slippageBps = params.slippageBps;
    }
    if (params.swapMode) {
      queryParams.swapMode = params.swapMode;
    }
    if (params.dynamicSlippage !== undefined) {
      queryParams.dynamicSlippage = params.dynamicSlippage;
    }
    if (params.priorityLevel) {
      queryParams.priorityLevel = params.priorityLevel;
    }

    const { data } = await apiClient.get<SwapOrderResponse>(
      `/v1/${networkId}/ft/swap/order`,
      { params: queryParams }
    );

    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[SolanaService] Failed to get swap order:', error);
    throw error;
  }
}

/**
 * Execute a signed swap transaction via API
 *
 * Endpoint: POST /v1/{networkId}/ft/swap/execute
 *
 * After signing the transaction from getSwapOrder(), submit it here for execution.
 * The backend handles transaction submission and confirmation.
 *
 * @param networkId - Solana network identifier
 * @param signedTransaction - Base64 encoded signed transaction
 * @param requestId - Request ID from the swap order response
 * @returns Execution result with signature
 */
export async function executeSwapApi(
  networkId: SolanaNetworkId,
  signedTransaction: string,
  requestId: string
): Promise<ApiSwapExecuteResponse> {
  try {
    const { data } = await apiClient.post<ApiSwapExecuteResponse>(
      `/v1/${networkId}/ft/swap/execute`,
      {
        signedTransaction,
        requestId,
      } as SwapExecuteRequest
    );

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('[SolanaService] Failed to execute swap:', error.message);
      return {
        signature: '',
        success: false,
        error: error.message,
      };
    }
    console.error('[SolanaService] Failed to execute swap:', error);
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get all transactions for an address (handles pagination automatically)
 *
 * Warning: This can make multiple API calls. Use with caution for addresses
 * with many transactions. Consider using getSolanaTransactions with manual
 * pagination for better control.
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param maxTransactions - Maximum number of transactions to fetch (default: 100)
 * @returns Array of all transactions up to the limit
 */
export async function getAllSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  maxTransactions: number = 100
): Promise<SolanaTransaction[]> {
  const allTransactions: SolanaTransaction[] = [];
  let before: string | undefined;
  let hasMore = true;

  while (hasMore && allTransactions.length < maxTransactions) {
    const remaining = maxTransactions - allTransactions.length;
    const limit = Math.min(remaining, 100);

    const response = await getSolanaTransactions(networkId, address, {
      before,
      limit,
    });

    allTransactions.push(...response.transactions);
    hasMore = response.hasMore;
    before = response.oldestSignature ?? undefined;

    // Safety check to prevent infinite loops
    if (response.transactions.length === 0) {
      break;
    }
  }

  return allTransactions;
}

/**
 * Get recent transactions via API (last N transactions)
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param count - Number of recent transactions to fetch (default: 10, max: 100)
 * @returns Array of recent transactions
 */
export async function getRecentSolanaTransactions(
  networkId: SolanaNetworkId,
  address: string,
  count: number = 10
): Promise<SolanaTransaction[]> {
  const response = await getSolanaTransactions(networkId, address, {
    limit: Math.min(count, 100),
  });
  return response.transactions;
}

/**
 * Get transactions filtered by type
 *
 * @param networkId - Solana network identifier
 * @param address - Solana wallet address
 * @param type - Transaction type to filter by
 * @param limit - Maximum number of transactions (default: 20)
 * @returns Array of transactions of the specified type
 */
export async function getTransactionsByType(
  networkId: SolanaNetworkId,
  address: string,
  type: SolanaTransactionType,
  limit: number = 20
): Promise<SolanaTransaction[]> {
  const response = await getSolanaTransactions(networkId, address, {
    type,
    limit,
  });
  return response.transactions;
}
