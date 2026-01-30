/**
 * Solana Transfer Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-transfer-service.js
 *
 * Provides functionality for transferring SOL and SPL tokens on Solana.
 * Supports both legacy SPL Token Program and Token-2022 extensions.
 *
 * Features:
 * - Native SOL transfers
 * - SPL token transfers (Token Program and Token-2022)
 * - Transfer fee handling for Token-2022
 * - Memo support for Token-2022 transfers
 * - Fee estimation
 * - Transaction confirmation
 * - Devnet airdrop support
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  SimulatedTransactionResponse,
  Commitment,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createTransferInstruction,
  createTransferCheckedWithFeeInstruction,
  getMemoTransfer,
  getMint,
  unpackAccount,
  getTransferFeeConfig,
  calculateFee,
  getExtensionTypes,
  ExtensionType,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { createMemoInstruction } from '@solana/spl-memo';

// ============================================================================
// Constants
// ============================================================================

/** Native SOL mint address (wrapped SOL) */
export const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for creating a transfer transaction
 */
export interface TransferOptions {
  /** Simulate transaction instead of sending */
  simulate?: boolean;
  /** Memo to attach to the transaction (for Token-2022) */
  memo?: string;
  /** Token decimals (used as fallback if mint lookup fails) */
  decimals?: number;
}

/**
 * Result of a transfer operation
 */
export interface TransferResult {
  /** Transaction ID (signature) */
  txId: TransactionSignature | SimulatedTransactionResponse;
}

/**
 * Options for estimating transaction fees
 */
export interface EstimateFeeOptions {
  /** Token decimals (used as fallback) */
  decimals?: number;
}

/**
 * Transfer fee information for Token-2022 tokens
 */
export interface TransferFeeInfo {
  /** Fee amount in token's smallest unit */
  fee: bigint;
  /** Maximum fee amount */
  maximumFee: bigint;
  /** Fee basis points */
  transferFeeBasisPoints: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Applies decimals to convert human-readable amount to raw amount
 *
 * @param amount - Human-readable amount
 * @param decimals - Number of decimal places
 * @returns Raw amount in smallest unit
 */
export function applyDecimals(amount: number, decimals: number): number {
  return Math.round(parseFloat(amount.toString()) * 10 ** decimals);
}

/**
 * Converts raw amount to human-readable amount
 *
 * @param amount - Raw amount in smallest unit
 * @param decimals - Number of decimal places
 * @returns Human-readable amount
 */
export function removeDecimals(amount: number | bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

/**
 * Checks if an address is the native SOL address
 *
 * @param address - Token address to check
 * @returns True if address is native SOL
 */
export function isNativeSol(address: string | null | undefined): boolean {
  return address === null || address === undefined || address === SOL_ADDRESS;
}

/**
 * Gets the token account for a given owner and mint
 *
 * @param connection - Solana connection
 * @param owner - Owner's public key
 * @param mint - Token mint address
 * @param programId - Token program ID
 * @returns Account info or null if not found
 */
async function getTokenAccount(
  connection: Connection,
  owner: PublicKey,
  mint: string,
  programId: PublicKey
): Promise<ReturnType<Connection['getAccountInfo']>> {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    new PublicKey(mint),
    owner,
    false,
    programId
  );
  return connection.getAccountInfo(associatedTokenAddress);
}

/**
 * Gets or creates an associated token account for a given owner
 *
 * @param connection - Solana connection
 * @param payer - Keypair paying for account creation
 * @param mint - Token mint address
 * @param owner - Owner's public key
 * @param programId - Token program ID
 * @returns Associated token account
 */
async function getOrCreateTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: string,
  owner: PublicKey,
  programId: PublicKey
): Promise<ReturnType<typeof getOrCreateAssociatedTokenAccount>> {
  return getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey(mint),
    owner,
    false,
    'confirmed' as Commitment,
    undefined,
    programId
  );
}

// ============================================================================
// Transfer Functions
// ============================================================================

/**
 * Creates and executes a transfer transaction for SOL or SPL tokens
 *
 * @param connection - Solana connection
 * @param fromKeyPair - Sender's keypair
 * @param toPublicKey - Recipient's public key
 * @param token - Token mint address (SOL_ADDRESS for native SOL)
 * @param amount - Amount to transfer (in human-readable format)
 * @param opts - Transfer options
 * @returns Transfer result with transaction ID
 *
 * @example
 * ```typescript
 * // Transfer SOL
 * const result = await createTransfer(
 *   connection,
 *   senderKeypair,
 *   recipientPublicKey,
 *   SOL_ADDRESS,
 *   1.5 // 1.5 SOL
 * );
 *
 * // Transfer SPL token
 * const result = await createTransfer(
 *   connection,
 *   senderKeypair,
 *   recipientPublicKey,
 *   'TokenMintAddress...',
 *   100 // 100 tokens
 * );
 * ```
 */
export async function createTransfer(
  connection: Connection,
  fromKeyPair: Keypair,
  toPublicKey: PublicKey,
  token: string,
  amount: number,
  opts: TransferOptions = {}
): Promise<TransferResult> {
  const { simulate = false } = opts;

  let transaction: Transaction;

  if (isNativeSol(token)) {
    transaction = await createSolTransaction(
      connection,
      fromKeyPair,
      toPublicKey,
      amount
    );
  } else {
    transaction = await createSplTransaction(
      connection,
      fromKeyPair,
      toPublicKey,
      token,
      amount,
      opts
    );
  }

  const result = await executeTransaction(connection, transaction, fromKeyPair, simulate);
  return { txId: result };
}

/**
 * Creates a native SOL transfer transaction
 *
 * @param connection - Solana connection
 * @param fromKeyPair - Sender's keypair
 * @param toPublicKey - Recipient's public key
 * @param amount - Amount in SOL
 * @returns Prepared transaction
 */
export async function createSolTransaction(
  connection: Connection,
  fromKeyPair: Keypair,
  toPublicKey: PublicKey,
  amount: number
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: fromKeyPair.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: fromKeyPair.publicKey,
      toPubkey: toPublicKey,
      lamports: Math.floor(LAMPORTS_PER_SOL * amount),
    })
  );

  return transaction;
}

/**
 * Creates an SPL token transfer transaction
 *
 * Handles both legacy Token Program and Token-2022:
 * - Automatically detects the token program
 * - Creates destination token account if needed
 * - Handles transfer fees for Token-2022 tokens
 * - Supports memo instructions for Token-2022
 *
 * @param connection - Solana connection
 * @param fromKeyPair - Sender's keypair
 * @param toPublicKey - Recipient's public key
 * @param tokenAddress - Token mint address
 * @param amount - Amount in human-readable format
 * @param opts - Transfer options
 * @returns Prepared transaction
 */
export async function createSplTransaction(
  connection: Connection,
  fromKeyPair: Keypair,
  toPublicKey: PublicKey,
  tokenAddress: string,
  amount: number,
  opts: TransferOptions = {}
): Promise<Transaction> {
  const { memo } = opts;

  const tokenAddressPublicKey = new PublicKey(tokenAddress);

  // Get token account info to determine the program ID
  const tokenInfo = await connection.getAccountInfo(tokenAddressPublicKey);
  if (!tokenInfo) {
    throw new Error(`Token mint ${tokenAddress} not found`);
  }

  const programId = tokenInfo.owner;

  // Get associated token addresses
  const fromTokenAddress = await getAssociatedTokenAddress(
    tokenAddressPublicKey,
    fromKeyPair.publicKey,
    false,
    programId
  );

  const toTokenAddress = await getAssociatedTokenAddress(
    tokenAddressPublicKey,
    toPublicKey,
    false,
    programId
  );

  // Get mint info for decimals
  const mint = await getMint(
    connection,
    tokenAddressPublicKey,
    'confirmed' as Commitment,
    programId
  );

  const decimals = mint?.decimals ?? opts?.decimals ?? 0;
  const transferAmount = applyDecimals(amount, decimals);

  // Create destination token account if it doesn't exist
  const destTokenAccount = await getTokenAccount(
    connection,
    toPublicKey,
    tokenAddress,
    programId
  );

  if (!destTokenAccount) {
    await getOrCreateTokenAccount(
      connection,
      fromKeyPair,
      tokenAddress,
      toPublicKey,
      programId
    );
  }

  const transaction = new Transaction();

  // Add memo instruction if provided
  if (memo) {
    transaction.add(createMemoInstruction(memo, [fromKeyPair.publicKey]));
  }

  // Check for transfer fee extension (Token-2022)
  const hasTransferFee = programId.equals(TOKEN_2022_PROGRAM_ID) &&
    getExtensionTypes(mint.tlvData).includes(ExtensionType.TransferFeeConfig);

  if (hasTransferFee) {
    const fee = await calculateTransferFee(connection, tokenAddress, amount);

    transaction.add(
      createTransferCheckedWithFeeInstruction(
        fromTokenAddress,
        tokenAddressPublicKey,
        toTokenAddress,
        fromKeyPair.publicKey,
        BigInt(transferAmount),
        decimals,
        fee ?? BigInt(0),
        [],
        programId
      )
    );
  } else {
    transaction.add(
      createTransferInstruction(
        fromTokenAddress,
        toTokenAddress,
        fromKeyPair.publicKey,
        transferAmount,
        [],
        programId
      )
    );
  }

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromKeyPair.publicKey;

  return transaction;
}

/**
 * Executes a prepared transaction
 *
 * @param connection - Solana connection
 * @param transaction - Prepared transaction
 * @param keyPair - Signer's keypair
 * @param simulate - Whether to simulate instead of send
 * @returns Transaction signature or simulation result
 */
async function executeTransaction(
  connection: Connection,
  transaction: Transaction,
  keyPair: Keypair,
  simulate: boolean
): Promise<TransactionSignature | SimulatedTransactionResponse> {
  if (simulate) {
    const result = await connection.simulateTransaction(transaction, [keyPair]);
    return result.value;
  }
  return sendTransaction(connection, transaction, keyPair);
}

/**
 * Sends a signed transaction to the network
 *
 * @param connection - Solana connection
 * @param transaction - Transaction to send
 * @param keyPair - Signer's keypair
 * @returns Transaction signature
 */
async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  keyPair: Keypair
): Promise<TransactionSignature> {
  // skipPreflight: false (default) ensures transactions are simulated before sending.
  // This prevents loss of fees on transactions that would fail.
  // @see https://solana.com/developers/guides/advanced/retry
  return connection.sendTransaction(transaction, [keyPair], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
}

// ============================================================================
// Fee Estimation
// ============================================================================

/**
 * Estimates the transaction fee for a transfer
 *
 * @param connection - Solana connection
 * @param fromKeyPair - Sender's keypair
 * @param toPublicKey - Recipient's public key
 * @param token - Token mint address
 * @param amount - Transfer amount
 * @param opts - Options
 * @returns Estimated fee in lamports or null
 */
export async function estimateFee(
  connection: Connection,
  fromKeyPair: Keypair,
  toPublicKey: PublicKey,
  token: string,
  amount: number,
  opts: EstimateFeeOptions = {}
): Promise<number | null> {
  let transaction: Transaction;

  if (isNativeSol(token)) {
    transaction = await createSolTransaction(
      connection,
      fromKeyPair,
      toPublicKey,
      amount
    );
  } else {
    transaction = await createSplTransaction(
      connection,
      fromKeyPair,
      toPublicKey,
      token,
      amount,
      opts
    );
  }

  return transaction.getEstimatedFee(connection);
}

/**
 * Calculates the transfer fee for a Token-2022 token with transfer fee extension
 *
 * @param connection - Solana connection
 * @param mint - Token mint address
 * @param amount - Transfer amount (human-readable)
 * @returns Fee amount in token's smallest unit, or null if no fee
 */
export async function calculateTransferFee(
  connection: Connection,
  mint: string,
  amount: number
): Promise<bigint | null> {
  if (!mint || isNativeSol(mint)) {
    return null;
  }

  const mintAddress = new PublicKey(mint);
  const accountInfo = await connection.getAccountInfo(mintAddress);

  if (accountInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
    const mintInfo = await getMint(
      connection,
      mintAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const transferAmount = BigInt(Math.floor(amount * 10 ** mintInfo.decimals));
    const transferFeeConfig = getTransferFeeConfig(mintInfo);

    if (transferFeeConfig) {
      return calculateFee(transferFeeConfig.newerTransferFee, transferAmount);
    }
  }

  return null;
}

// ============================================================================
// Memo Requirements
// ============================================================================

/**
 * Checks if the destination token account requires a memo for transfers
 *
 * This is a Token-2022 feature that allows accounts to require
 * incoming transfers to include a memo instruction.
 *
 * @param connection - Solana connection
 * @param toPublicKey - Recipient's public key
 * @param tokenAddress - Token mint address
 * @returns True if memo is required
 */
export async function requiresMemo(
  connection: Connection,
  toPublicKey: PublicKey,
  tokenAddress: string | null | undefined
): Promise<boolean> {
  if (isNativeSol(tokenAddress)) {
    return false;
  }

  const tokenAddressPublicKey = new PublicKey(tokenAddress!);
  const tokenInfo = await connection.getAccountInfo(tokenAddressPublicKey);

  if (!tokenInfo) {
    return false;
  }

  const programId = tokenInfo.owner;

  if (programId.equals(TOKEN_2022_PROGRAM_ID)) {
    const toTokenAddress = await getAssociatedTokenAddress(
      tokenAddressPublicKey,
      toPublicKey,
      false,
      programId
    );

    const accountInfo = await connection.getAccountInfo(toTokenAddress);

    if (accountInfo) {
      const account = unpackAccount(
        toTokenAddress,
        accountInfo,
        TOKEN_2022_PROGRAM_ID
      );
      const memoDetails = getMemoTransfer(account);

      if (memoDetails) {
        return memoDetails.requireIncomingTransferMemos;
      }
    }
  }

  return false;
}

// ============================================================================
// Transaction Confirmation
// ============================================================================

/**
 * Confirms a transaction on the network
 *
 * @param connection - Solana connection
 * @param txId - Transaction signature to confirm
 * @returns Confirmation result
 */
export async function confirmTransaction(
  connection: Connection,
  txId: TransactionSignature
): Promise<RpcResponseAndContext<SignatureResult>> {
  return connection.confirmTransaction(txId);
}

// ============================================================================
// Airdrop (Devnet/Testnet only)
// ============================================================================

/**
 * Requests an airdrop of SOL (devnet/testnet only)
 *
 * @param connection - Solana connection
 * @param publicKey - Public key to receive the airdrop
 * @param amount - Amount in SOL
 * @returns Confirmation result
 *
 * @example
 * ```typescript
 * // Request 1 SOL on devnet
 * const devnetConnection = new Connection('https://api.devnet.solana.com');
 * await airdrop(devnetConnection, myPublicKey, 1);
 * ```
 */
export async function airdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number
): Promise<RpcResponseAndContext<SignatureResult>> {
  const airdropSignature = await connection.requestAirdrop(
    publicKey,
    Math.floor(amount * LAMPORTS_PER_SOL)
  );
  return connection.confirmTransaction(airdropSignature);
}
