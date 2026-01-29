/**
 * Solana Transaction History Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-transaction-service.js
 *
 * This module provides a blockchain-level interface for transaction history.
 * It delegates to the API service for actual API calls while providing
 * convenient helper functions for transaction analysis.
 *
 * API Endpoints used:
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 * - GET /v1/{networkId}/account/{address}/transactions/{txId} - Get single transaction
 */

import {
  getSolanaTransaction,
  getSolanaTransactions,
  type SolanaTransaction,
  type SolanaTransactionsResponse,
  type SolanaPagingParams,
  type SolanaTokenTransfer,
  type SolanaNativeTransfer,
  type SolanaAccountData,
  type SolanaTransactionType,
  type SolanaTransactionStatus,
  type SolanaInstruction,
  type SolanaNetworkId,
} from '../../api/services/solana';

// ============================================================================
// Re-export API types for convenience
// ============================================================================

export type {
  SolanaTransaction,
  SolanaTransactionsResponse,
  SolanaPagingParams,
  SolanaTokenTransfer,
  SolanaNativeTransfer,
  SolanaAccountData,
  SolanaTransactionType,
  SolanaTransactionStatus,
  SolanaInstruction,
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
// API Functions (v2 compatible interface)
// ============================================================================

/**
 * Get a single transaction by ID
 *
 * @param networkId - The network ID (e.g., 'solana-mainnet', 'solana-devnet')
 * @param address - The account address to get transaction for
 * @param txId - The transaction signature/ID
 * @returns Transaction data or null if not found
 *
 * @example
 * ```typescript
 * const tx = await getTransaction(
 *   'solana-mainnet',
 *   'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
 *   '5xG8...abc'
 * );
 * if (tx) {
 *   console.log(`Transaction type: ${tx.type}`);
 * }
 * ```
 */
export async function getTransaction(
  networkId: string,
  address: string,
  txId: string
): Promise<SolanaTransaction | null> {
  return getSolanaTransaction(networkId as SolanaNetworkId, address, txId);
}

/**
 * Get recent transactions for an account with pagination support
 *
 * @param networkId - The network ID (e.g., 'solana-mainnet', 'solana-devnet')
 * @param address - The account address to get transactions for
 * @param paging - Optional pagination parameters
 * @returns Paginated transaction list response
 *
 * @example
 * ```typescript
 * // First page
 * const page1 = await getRecentTransactions('solana-mainnet', publicKey);
 * console.log(`Found ${page1.data.length} transactions`);
 *
 * // Next page (if available)
 * if (page1.pageToken) {
 *   const page2 = await getRecentTransactions('solana-mainnet', publicKey, {
 *     nextPageToken: page1.pageToken,
 *     pageSize: 20
 *   });
 * }
 * ```
 */
export async function getRecentTransactions(
  networkId: string,
  address: string,
  paging?: SolanaTransactionPaging
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

  const response = await getSolanaTransactions(
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
 * Check if a transaction is a transfer (SOL or token)
 * @param tx - Transaction to check
 * @returns True if the transaction is a transfer
 */
export function isTransferTransaction(tx: SolanaTransaction): boolean {
  return tx.type === 'TRANSFER' || tx.nativeTransfers.length > 0 || tx.tokenTransfers.length > 0;
}

/**
 * Check if a transaction is a swap
 * @param tx - Transaction to check
 * @returns True if the transaction is a swap
 */
export function isSwapTransaction(tx: SolanaTransaction): boolean {
  return tx.type === 'SWAP';
}

/**
 * Check if a transaction is NFT-related
 * @param tx - Transaction to check
 * @returns True if the transaction is NFT-related
 */
export function isNftTransaction(tx: SolanaTransaction): boolean {
  return tx.type.startsWith('NFT_') || tx.type.startsWith('COMPRESSED_NFT_');
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
 * Get the total SOL amount transferred in a transaction
 * @param tx - Transaction to get SOL amount from
 * @param userAddress - The user's address to determine direction
 * @returns Net SOL amount in lamports (positive = received, negative = sent)
 */
export function getNetSolAmount(tx: SolanaTransaction, userAddress: string): number {
  let netAmount = 0;

  for (const transfer of tx.nativeTransfers) {
    if (transfer.toAddress === userAddress) {
      netAmount += transfer.amount;
    }
    if (transfer.fromAddress === userAddress) {
      netAmount -= transfer.amount;
    }
  }

  return netAmount;
}

/**
 * Get token transfers for a specific user
 * @param tx - Transaction to get token transfers from
 * @param userAddress - The user's address
 * @returns Token transfers involving the user
 */
export function getUserTokenTransfers(
  tx: SolanaTransaction,
  userAddress: string
): SolanaTokenTransfer[] {
  return tx.tokenTransfers.filter(
    (transfer) =>
      transfer.fromAddress === userAddress || transfer.toAddress === userAddress
  );
}

/**
 * Get native SOL transfers for a specific user
 * @param tx - Transaction to get native transfers from
 * @param userAddress - The user's address
 * @returns Native transfers involving the user
 */
export function getUserNativeTransfers(
  tx: SolanaTransaction,
  userAddress: string
): SolanaNativeTransfer[] {
  return tx.nativeTransfers.filter(
    (transfer) =>
      transfer.fromAddress === userAddress || transfer.toAddress === userAddress
  );
}

/**
 * Format a transaction timestamp to a Date object
 * @param tx - Transaction to get date from
 * @returns Date object or null if no block time
 */
export function getTransactionDate(tx: SolanaTransaction): Date | null {
  if (tx.blockTime === null) {
    return null;
  }
  return new Date(tx.blockTime * 1000);
}

/**
 * Get a human-readable time ago string for a transaction
 * @param tx - Transaction to get time ago for
 * @returns Human-readable time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(tx: SolanaTransaction): string {
  if (tx.blockTime === null) {
    return 'Unknown';
  }

  const now = Date.now();
  const txTime = tx.blockTime * 1000;
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
  return tx.type === 'STAKE' || tx.type === 'UNSTAKE';
}

/**
 * Check if a transaction involves token minting or burning
 * @param tx - Transaction to check
 * @returns True if the transaction is a mint or burn
 */
export function isTokenMintOrBurn(tx: SolanaTransaction): boolean {
  return tx.type === 'TOKEN_MINT' || tx.type === 'TOKEN_BURN';
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
