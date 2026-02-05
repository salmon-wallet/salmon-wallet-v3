/**
 * useTransactions Hook
 *
 * Fetches and manages transaction history for a Solana wallet address.
 * Supports pagination, caching, and transforms API data to UI-friendly format.
 *
 * Features:
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
 *   networkId: 'solana-mainnet',
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSolanaTransactions,
  type SolanaNetworkId,
  type SolanaTransaction,
} from '../api/services/solana';

// ============================================================================
// Types
// ============================================================================

/**
 * Transaction type constants matching the UI component types
 * Prefixed with "History" to avoid collision with other TransactionType exports
 */
export type HistoryTransactionType =
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
 * Transaction status for history items
 * Prefixed with "History" to avoid collision with other TransactionStatus exports
 */
export type HistoryTransactionStatus = 'completed' | 'failed' | 'pending';

/**
 * Token amount in a transaction
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
 * Transaction fee information
 */
export interface TransactionFee {
  /** Fee amount in smallest unit */
  amount: number;
  /** Fee decimals */
  decimals: number;
  /** Fee token symbol */
  symbol: string;
}

/**
 * Processed transaction for display in the UI
 */
export interface HistoryTransaction {
  /** Transaction ID (signature) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status */
  status: HistoryTransactionStatus;
  /** Transaction type */
  type: HistoryTransactionType;
  /** Fee information */
  fee?: TransactionFee;
  /** Inputs (tokens received) */
  inputs: TransactionTokenAmount[];
  /** Outputs (tokens sent) */
  outputs: TransactionTokenAmount[];
  /** Human-readable description from Helius */
  description?: string;
  /** Source protocol (e.g., 'JUPITER', 'MAGIC_EDEN') */
  source?: string;
  /** Original Helius transaction type */
  heliusType?: string;
}

/**
 * Options for the useTransactions hook
 */
export interface UseTransactionsOptions {
  /** Wallet address to fetch transactions for */
  address: string | undefined;
  /** Network identifier */
  networkId?: SolanaNetworkId;
  /** Initial page size */
  pageSize?: number;
  /** Whether to skip initial fetch */
  skip?: boolean;
}

/**
 * Return type for the useTransactions hook
 */
export interface UseTransactionsResult {
  /** Processed transactions */
  transactions: HistoryTransaction[];
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
// Helper Functions
// ============================================================================

/**
 * Transform a backend transaction to the UI HistoryTransaction format.
 *
 * Note: The backend already returns transactions in a UI-friendly format
 * with inputs/outputs instead of raw Helius format. This function does
 * a simple mapping with type assertions.
 */
function transformTransaction(tx: SolanaTransaction): HistoryTransaction {
  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as HistoryTransactionStatus,
    type: tx.type as HistoryTransactionType,
    fee: tx.fee ?? undefined,
    inputs: tx.inputs,
    outputs: tx.outputs,
    description: tx.description,
    source: tx.source,
    heliusType: tx.heliusType,
  };
}

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
}: UseTransactionsOptions): UseTransactionsResult {
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
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
        const response = await getSolanaTransactions(networkId, address, {
          pageToken: isLoadMore ? oldestSignatureRef.current : undefined,
          pageSize,
        });

        // Transform transactions to UI format (simple mapping since backend is pre-formatted)
        const newTransactions = response.transactions.map(transformTransaction);

        if (isLoadMore) {
          // Append to existing transactions
          setTransactions((prev) => [...prev, ...newTransactions]);
        } else {
          // Replace transactions
          setTransactions(newTransactions);
          cacheTimestampRef.current = now;
        }

        // Update pagination state
        oldestSignatureRef.current = response.oldestSignature ?? undefined;
        setHasMore(response.hasMore);
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
    [address, networkId, pageSize, skip]
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
