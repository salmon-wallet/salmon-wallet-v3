/**
 * useTransactions Hook
 *
 * Fetches and manages transaction history for multi-chain wallet addresses.
 * Supports Solana, Bitcoin, and Ethereum networks.
 * Provides pagination, caching, and transforms API data to UI-friendly format.
 *
 * Features:
 * - Multi-chain support (Solana, Bitcoin, Ethereum)
 * - Automatic pagination with "load more" functionality
 * - 30-second cache TTL for performance
 * - Direct mapping from backend response (already UI-formatted)
 * - Loading and error states
 * - Pull-to-refresh support
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   loading,
 *   error,
 *   hasMore,
 *   loadMore,
 *   refresh,
 * } = useTransactions({
 *   address: walletAddress,
 *   networkId: 'solana-mainnet', // or 'bitcoin-mainnet', 'ethereum-mainnet', etc.
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BlockchainAccount, NetworkId } from '../types/blockchain';
import type { Transaction, TransactionItem } from '../types/transaction';
import { isSolanaAccount, getBlockchainFromNetworkId } from '../utils/account';
import { transformSolanaTransaction, transformMultichainTransaction } from '../utils/transactions';

/**
 * Options for the useTransactions hook
 */
export interface UseTransactionsOptions {
  /** Wallet address to fetch transactions for */
  address: string | undefined;
  /** Network identifier (supports Solana, Bitcoin, and Ethereum networks) */
  networkId?: NetworkId;
  /** Initial page size */
  pageSize?: number;
  /** Whether to skip initial fetch */
  skip?: boolean;
  /** Blockchain account instance (used for DI-based transaction fetching) */
  account?: BlockchainAccount;
}

/**
 * Return type for the useTransactions hook
 */
export interface UseTransactionsResult {
  /** Processed transactions */
  transactions: Transaction[];
  /** Whether initial data is loading */
  loading: boolean;
  /** Whether more data is being loaded */
  loadingMore: boolean;
  /** Whether a refresh is in progress */
  refreshing: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether there are more transactions to load */
  hasMore: boolean;
  /** Load more transactions */
  loadMore: () => Promise<void>;
  /** Refresh all transactions */
  refresh: () => Promise<void>;
  /** Total number of transactions loaded */
  totalCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Cache TTL in milliseconds (30 seconds) */
const CACHE_TTL = 30 * 1000;

/** Default page size */
const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for fetching and managing transaction history
 *
 * @param options - Hook configuration options
 * @returns Transaction data and state
 */
export function useTransactions({
  address,
  networkId = 'solana-mainnet',
  pageSize = DEFAULT_PAGE_SIZE,
  skip = false,
  account,
}: UseTransactionsOptions): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs for pagination and caching
  const oldestSignatureRef = useRef<string | undefined>(undefined);
  const cacheTimestampRef = useRef<number>(0);
  const fetchedAddressRef = useRef<string | undefined>(undefined);

  /**
   * Fetch transactions from the API
   */
  const fetchTransactions = useCallback(
    async (options: { isLoadMore?: boolean; isRefresh?: boolean } = {}) => {
      const { isLoadMore = false, isRefresh = false } = options;

      if (!address || skip) {
        return;
      }

      // Check if we need to reset on address change
      if (fetchedAddressRef.current !== address) {
        setTransactions([]);
        oldestSignatureRef.current = undefined;
        fetchedAddressRef.current = address;
      }

      // Check cache validity for initial/refresh loads
      const now = Date.now();
      if (!isLoadMore && !isRefresh && now - cacheTimestampRef.current < CACHE_TTL) {
        return;
      }

      // Set appropriate loading state
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
        // Reset pagination on refresh
        oldestSignatureRef.current = undefined;
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const blockchain = getBlockchainFromNetworkId(networkId);
        let newTransactions: Transaction[];
        let nextPageToken: string | undefined;
        let hasMorePages: boolean;

        if (!account) {
          return;
        }

        if (isSolanaAccount(account)) {
          // Use SolanaAccount DI method
          const response = await account.getRecentTransactions({
            nextPageToken: isLoadMore ? oldestSignatureRef.current : undefined,
            pageSize,
          });
          newTransactions = response.data.map(transformSolanaTransaction);
          nextPageToken = response.pageToken;
          hasMorePages = !!response.pageToken;
        } else {
          // Use BitcoinAccount/EthereumAccount DI method
          const response = await account.getRecentTransactions({
            nextPageToken: isLoadMore ? oldestSignatureRef.current : undefined,
            pageSize,
          });
          // AccountTransaction and TransactionItem share the same backend shape
          newTransactions = response.items.map(tx => transformMultichainTransaction(tx as unknown as TransactionItem, blockchain));
          nextPageToken = response.nextPageToken;
          hasMorePages = !!response.nextPageToken;
        }

        if (isLoadMore) {
          // Append to existing transactions
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const unique = newTransactions.filter((t) => !existingIds.has(t.id));
            return [...prev, ...unique];
          });
        } else {
          // Replace transactions
          setTransactions(newTransactions);
          cacheTimestampRef.current = now;
        }

        // Update pagination state
        oldestSignatureRef.current = nextPageToken;
        setHasMore(hasMorePages);
      } catch (err) {
        console.error('[useTransactions] Failed to fetch transactions:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch transactions'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [address, networkId, pageSize, skip, account]
  );

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /**
   * Load more transactions (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    await fetchTransactions({ isLoadMore: true });
  }, [fetchTransactions, hasMore, loadingMore, loading]);

  /**
   * Refresh all transactions
   */
  const refresh = useCallback(async () => {
    await fetchTransactions({ isRefresh: true });
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount: transactions.length,
  };
}

export default useTransactions;
