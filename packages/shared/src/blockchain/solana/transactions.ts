/**
 * Solana Transaction History Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-transaction-service.js
 *
 * This module provides a blockchain-level interface for transaction history.
 * It provides convenient helper functions for transaction analysis and
 * adapter logic for converting between paging formats.
 *
 * Note: The backend returns transactions already transformed to UI format
 * with inputs/outputs arrays instead of raw Helius format.
 */

import type {
  SolanaTransaction,
  SolanaTransactionsResponse,
  SolanaPagingParams,
  SolanaTransactionTokenAmount,
  SolanaTransactionFee,
  SolanaTransactionTypeBackend,
  SolanaTransactionStatusBackend,
  SolanaNetworkId,
} from '../../api/services/solana';

// ============================================================================
// Re-export API types for convenience
// ============================================================================

export type {
  SolanaTransaction,
  SolanaTransactionsResponse,
  SolanaPagingParams,
  SolanaTransactionTokenAmount,
  SolanaTransactionFee,
  SolanaTransactionTypeBackend,
  SolanaTransactionStatusBackend,
  SolanaNetworkId,
};

// ============================================================================
// Paging Types (matching v2 interface)
// ============================================================================

/**
 * Transaction paging parameters for Solana (v2 compatible interface)
 */
export interface SolanaTransactionPaging {
  /** Token for fetching the next page of results */
  nextPageToken?: string;
  /** Number of transactions per page */
  pageSize?: number;
}

/**
 * Paginated transaction list response (v2 compatible interface)
 */
export interface SolanaTransactionListResponse {
  /** Array of transactions */
  data: SolanaTransaction[];
  /** Token for fetching the next page (null if no more pages) */
  pageToken?: string;
}

// ============================================================================
// API Function Types
// ============================================================================

export type GetSolanaTransactionsFn = (
  networkId: SolanaNetworkId,
  address: string,
  paging?: SolanaPagingParams
) => Promise<SolanaTransactionsResponse>;

// ============================================================================
// API Functions (v2 compatible interface)
// ============================================================================

export async function getRecentTransactions(
  networkId: string,
  address: string,
  paging: SolanaTransactionPaging | undefined,
  fetchTransactions: GetSolanaTransactionsFn
): Promise<SolanaTransactionListResponse> {
  const { nextPageToken, pageSize } = paging || {};

  // Convert v2-style paging to API service paging
  const apiPaging: SolanaPagingParams = {};
  if (nextPageToken) {
    apiPaging.before = nextPageToken;
  }
  if (pageSize) {
    apiPaging.limit = pageSize;
  }

  const response = await fetchTransactions(
    networkId as SolanaNetworkId,
    address,
    apiPaging
  );

  // Convert API response to v2-compatible format
  return {
    data: response.transactions,
    pageToken: response.hasMore ? response.oldestSignature ?? undefined : undefined,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a transaction is a transfer (send or receive)
 * @param tx - Transaction to check
 * @returns True if the transaction is a transfer
 */
export function isTransferTransaction(tx: SolanaTransaction): boolean {
  return tx.type === 'send' || tx.type === 'receive';
}

/**
 * Check if a transaction is a swap
 * @param tx - Transaction to check
 * @returns True if the transaction is a swap
 */
export function isSwapTransaction(tx: SolanaTransaction): boolean {
  return tx.type === 'swap';
}

/**
 * Check if a transaction is NFT-related
 * Uses heliusType to check for NFT operations
 * @param tx - Transaction to check
 * @returns True if the transaction is NFT-related
 */
export function isNftTransaction(tx: SolanaTransaction): boolean {
  const heliusType = tx.heliusType || '';
  return heliusType.startsWith('NFT_') || heliusType.startsWith('COMPRESSED_NFT_');
}

/**
 * Check if a transaction was successful
 * @param tx - Transaction to check
 * @returns True if the transaction was successful
 */
export function isSuccessful(tx: SolanaTransaction): boolean {
  return tx.status !== 'failed';
}

/**
 * Check if a transaction failed
 * @param tx - Transaction to check
 * @returns True if the transaction failed
 */
export function isFailed(tx: SolanaTransaction): boolean {
  return tx.status === 'failed';
}

/**
 * Get the net amount for a specific token in a transaction
 * @param tx - Transaction to analyze
 * @param tokenContract - Token contract/mint address to look for
 * @returns Net amount (positive = received, negative = sent), or null if token not found
 */
export function getNetTokenAmount(
  tx: SolanaTransaction,
  tokenContract: string
): { amount: string; decimals: number; symbol: string } | null {
  // Check inputs (received tokens)
  const inputToken = tx.inputs.find((i) => i.contract === tokenContract);
  if (inputToken) {
    return {
      amount: inputToken.amount,
      decimals: inputToken.decimals,
      symbol: inputToken.symbol,
    };
  }

  // Check outputs (sent tokens) - negate amount
  const outputToken = tx.outputs.find((o) => o.contract === tokenContract);
  if (outputToken) {
    // Negate for sent tokens
    const negatedAmount = BigInt(outputToken.amount) * -1n;
    return {
      amount: negatedAmount.toString(),
      decimals: outputToken.decimals,
      symbol: outputToken.symbol,
    };
  }

  return null;
}

/**
 * Get all tokens involved in a transaction
 * @param tx - Transaction to get tokens from
 * @returns Array of unique token contracts
 */
export function getInvolvedTokens(tx: SolanaTransaction): string[] {
  const tokens = new Set<string>();

  tx.inputs.forEach((i) => tokens.add(i.contract));
  tx.outputs.forEach((o) => tokens.add(o.contract));

  return Array.from(tokens);
}

/**
 * Format a transaction timestamp to a Date object
 * @param tx - Transaction to get date from
 * @returns Date object
 */
export function getTransactionDate(tx: SolanaTransaction): Date {
  return new Date(tx.timestamp * 1000);
}

/**
 * Get a human-readable time ago string for a transaction
 * @param tx - Transaction to get time ago for
 * @returns Human-readable time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(tx: SolanaTransaction): string {
  const now = Date.now();
  const txTime = tx.timestamp * 1000;
  const diff = now - txTime;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

/**
 * Check if a transaction is a staking operation
 * @param tx - Transaction to check
 * @returns True if the transaction is stake-related
 */
export function isStakingTransaction(tx: SolanaTransaction): boolean {
  return tx.type === 'stake';
}

/**
 * Check if a transaction involves token minting or burning
 * @param tx - Transaction to check
 * @returns True if the transaction is a mint or burn
 */
export function isTokenMintOrBurn(tx: SolanaTransaction): boolean {
  return tx.type === 'mint' || tx.type === 'burn';
}

/**
 * Get the transaction explorer URL
 * @param tx - Transaction to get URL for
 * @param networkId - Network ID
 * @returns Solana explorer URL for the transaction
 */
export function getExplorerUrl(tx: SolanaTransaction, networkId: string): string {
  const cluster = networkId === 'solana-devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/tx/${tx.signature}${cluster}`;
}

/**
 * Get the Solscan explorer URL
 * @param tx - Transaction to get URL for
 * @param networkId - Network ID
 * @returns Solscan explorer URL for the transaction
 */
export function getSolscanUrl(tx: SolanaTransaction, networkId: string): string {
  const cluster = networkId === 'solana-devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/tx/${tx.signature}${cluster}`;
}
