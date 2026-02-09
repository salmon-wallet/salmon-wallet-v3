/**
 * Multi-chain Transaction Service
 * Fetches transaction history for Bitcoin and Ethereum via Ubiquity API
 *
 * API Endpoints:
 * - GET /v1/{networkId}/account/{address}/transactions - Get paginated transactions
 * - GET /v1/{networkId}/account/{address}/transactions/{txId} - Get single transaction
 *
 * Note: Solana transactions are handled separately in solana.ts
 */

import { apiClient, ApiError } from '../client';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported network identifiers for multi-chain transactions
 * Note: Solana networks are handled in solana.ts
 */
export type TransactionNetworkId =
  | 'solana-mainnet'
  | 'solana-devnet'
  | 'bitcoin-mainnet'
  | 'bitcoin-testnet'
  | 'ethereum-mainnet'
  | 'ethereum-sepolia';

/**
 * Transaction type classification
 */
export type TransactionType = 'send' | 'receive' | 'swap' | 'unknown';

/**
 * Token amount within a transaction (input or output)
 */
export interface TransactionTokenAmount {
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
  /** Token contract address */
  contract: string;
  /** Source address (for receives) */
  source?: string;
  /** Destination address (for sends) */
  destination?: string;
}

/**
 * Transaction fee information
 */
export interface TransactionFee {
  /** Fee amount (raw, in smallest unit) */
  amount: string;
  /** Fee decimals */
  decimals: number;
  /** Fee token symbol (e.g., 'BTC', 'ETH') */
  symbol: string;
}

/**
 * Single transaction item from the API
 */
export interface TransactionItem {
  /** Transaction ID (hash) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status */
  status: string;
  /** Transaction type classification */
  type: TransactionType;
  /** Transaction fee (null if user didn't pay fee) */
  fee?: TransactionFee;
  /** Tokens received */
  inputs: TransactionTokenAmount[];
  /** Tokens sent */
  outputs: TransactionTokenAmount[];
}

/**
 * Pagination parameters for transaction queries
 */
export interface TransactionPagingParams {
  /** Number of items per page (max 100) */
  pageSize?: number;
  /** Page token for cursor-based pagination */
  pageToken?: string;
}

/**
 * Paginated transaction response from the API
 */
export interface TransactionsResponse {
  /** Array of transactions */
  data: TransactionItem[];
  /** Token for fetching the next page */
  pageToken?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated transactions for an address on any supported blockchain
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions
 *
 * @param networkId - Network identifier (bitcoin-mainnet, ethereum-mainnet, etc.)
 * @param address - Wallet address
 * @param options - Optional pagination parameters
 * @returns Paginated transaction response
 */
export async function getTransactions(
  networkId: TransactionNetworkId,
  address: string,
  options?: TransactionPagingParams
): Promise<TransactionsResponse> {
  try {
    const params: Record<string, string | number> = {};

    if (options?.pageSize) {
      params.pageSize = options.pageSize;
    }
    if (options?.pageToken) {
      params.pageToken = options.pageToken;
    }

    // Backend returns { data: TransactionItem[], pageToken?: string }
    const { data: response } = await apiClient.get<TransactionsResponse>(
      `/v1/${networkId}/account/${address}/transactions`,
      { params }
    );

    return {
      data: response.data || [],
      pageToken: response.pageToken,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return { data: [] };
    }
    console.error('[TransactionService] Failed to get transactions:', error);
    throw error;
  }
}

/**
 * Get a single transaction by ID
 *
 * Endpoint: GET /v1/{networkId}/account/{address}/transactions/{txId}
 *
 * @param networkId - Network identifier
 * @param address - Wallet address
 * @param txId - Transaction ID/hash
 * @returns Transaction data, or null if not found
 */
export async function getTransaction(
  networkId: TransactionNetworkId,
  address: string,
  txId: string
): Promise<TransactionItem | null> {
  try {
    const { data } = await apiClient.get<TransactionItem>(
      `/v1/${networkId}/account/${address}/transactions/${txId}`
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      return null;
    }
    console.error('[TransactionService] Failed to get transaction:', error);
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get recent transactions (last N transactions)
 *
 * @param networkId - Network identifier
 * @param address - Wallet address
 * @param count - Number of recent transactions to fetch (default: 10, max: 100)
 * @returns Array of recent transactions
 */
export async function getRecentTransactions(
  networkId: TransactionNetworkId,
  address: string,
  count: number = 10
): Promise<TransactionItem[]> {
  const response = await getTransactions(networkId, address, {
    pageSize: Math.min(count, 100),
  });
  return response.data;
}

/**
 * Get all transactions for an address (handles pagination automatically)
 *
 * Warning: This can make multiple API calls. Use with caution for addresses
 * with many transactions. Consider using getTransactions with manual
 * pagination for better control.
 *
 * @param networkId - Network identifier
 * @param address - Wallet address
 * @param maxTransactions - Maximum number of transactions to fetch (default: 100)
 * @returns Array of all transactions up to the limit
 */
export async function getAllTransactions(
  networkId: TransactionNetworkId,
  address: string,
  maxTransactions: number = 100
): Promise<TransactionItem[]> {
  const allTransactions: TransactionItem[] = [];
  let pageToken: string | undefined;
  let hasMore = true;

  while (hasMore && allTransactions.length < maxTransactions) {
    const remaining = maxTransactions - allTransactions.length;
    const pageSize = Math.min(remaining, 100);

    const response = await getTransactions(networkId, address, {
      pageSize,
      pageToken,
    });

    allTransactions.push(...response.data);
    hasMore = !!response.pageToken;
    pageToken = response.pageToken;

    // Safety check to prevent infinite loops
    if (response.data.length === 0) {
      break;
    }
  }

  return allTransactions;
}
