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
import {
  getSolanaTransactions,
  type SolanaTransaction,
} from '../api/services/solana';
import {
  getTransactions as getMultichainTransactions,
  type TransactionNetworkId,
  type TransactionItem,
} from '../api/services/transactions';
import type {
  TransactionType,
  TransactionDisplayStatus,
  TransactionTokenAmount,
  TransactionFee,
} from '../types/transaction';

// ============================================================================
// Types
// ============================================================================

/**
 * Processed transaction for display in the UI
 */
export interface Transaction {
  /** Transaction ID (signature) */
  id: string;
  /** Unix timestamp in seconds */
  timestamp: number;
  /** Transaction status */
  status: TransactionDisplayStatus;
  /** Transaction type */
  type: TransactionType;
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
 * Blockchain type derived from network ID
 */
type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Determine blockchain type from network ID
 */
function getBlockchainFromNetworkId(networkId: string): BlockchainType {
  if (networkId.startsWith('bitcoin')) return 'bitcoin';
  if (networkId.startsWith('ethereum')) return 'ethereum';
  return 'solana';
}

/**
 * Options for the useTransactions hook
 */
export interface UseTransactionsOptions {
  /** Wallet address to fetch transactions for */
  address: string | undefined;
  /** Network identifier (supports Solana, Bitcoin, and Ethereum networks) */
  networkId?: TransactionNetworkId;
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
// Helper Functions
// ============================================================================

/**
 * Transform a Solana backend transaction to the UI Transaction format.
 *
 * Note: The backend already returns transactions in a UI-friendly format
 * with inputs/outputs instead of raw Helius format. This function does
 * a simple mapping with type assertions.
 */
function transformSolanaTransaction(tx: SolanaTransaction): Transaction {
  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type: tx.type as TransactionType,
    fee: tx.fee ?? undefined,
    inputs: tx.inputs,
    outputs: tx.outputs,
    description: tx.description,
    source: tx.source,
    heliusType: tx.heliusType,
  };
}

/**
 * Transform a multi-chain (Bitcoin/Ethereum) transaction to the UI Transaction format.
 *
 * Note: The multi-chain API returns transactions in a similar format but with
 * some differences in the fee structure (amount is string vs number).
 */
function transformMultichainTransaction(tx: TransactionItem): Transaction {
  return {
    id: tx.id,
    timestamp: tx.timestamp,
    status: tx.status as TransactionDisplayStatus,
    type: tx.type as TransactionType,
    fee: tx.fee
      ? {
          amount: Number(tx.fee.amount),
          decimals: tx.fee.decimals,
          symbol: tx.fee.symbol,
        }
      : undefined,
    inputs: tx.inputs,
    outputs: tx.outputs,
    // Moralis enrichment fields
    description: tx.description,
    source: tx.source,
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

        if (blockchain === 'solana') {
          // Use Solana-specific service
          const response = await getSolanaTransactions(
            networkId as 'solana-mainnet' | 'solana-devnet',
            address,
            {
              pageToken: isLoadMore ? oldestSignatureRef.current : undefined,
              pageSize,
            }
          );
          newTransactions = response.transactions.map(transformSolanaTransaction);
          nextPageToken = response.oldestSignature ?? undefined;
          hasMorePages = response.hasMore;
        } else {
          // Use multi-chain service for Bitcoin and Ethereum
          const response = await getMultichainTransactions(networkId, address, {
            pageToken: isLoadMore ? oldestSignatureRef.current : undefined,
            pageSize,
          });
          newTransactions = response.data.map(transformMultichainTransaction);
          nextPageToken = response.pageToken;
          hasMorePages = !!response.pageToken;
        }

        if (isLoadMore) {
          // Append to existing transactions
          setTransactions((prev) => [...prev, ...newTransactions]);
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
