/**
 * useBalance Hook
 *
 * Provides wallet balance data with automatic refresh and caching.
 * Supports multiple blockchain types: Solana, Bitcoin, and Ethereum.
 *
 * All three chains (Solana, Bitcoin, Ethereum) follow the same pattern:
 * calls account.getBalance() which returns a rich wallet balance object
 * via DI-injected backend functions, then transforms to WalletBalance format.
 *
 * Features:
 * - 60-second cache TTL
 * - Pull-to-refresh support
 * - Privacy mode support (hiddenBalance)
 * - Loading and error states
 * - Multi-chain account support
 *
 * @example
 * ```tsx
 * const { balance, loading, error, refresh, hiddenBalance, toggleHidden } = useBalance({
 *   account: activeBlockchainAccount,
 *   networkId: 'solana-mainnet',
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SolanaAccount } from '../blockchain/solana';
import type { BitcoinAccount } from '../blockchain/bitcoin';
import type { EthereumAccount } from '../blockchain/ethereum';
import type { BlockchainAccount, NetworkId } from '../types/blockchain';
import { isSolanaAccount, isBitcoinAccount, isEthereumAccount } from '../utils/account';
import { removeDecimals } from '../utils/decimals';

import {
  type WalletBalance,
  type TokenBalanceWithPrice,
} from '../utils/balance';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useBalance hook
 */
export interface UseBalanceParams {
  /** The blockchain account instance (Solana, Bitcoin, or Ethereum) */
  account: BlockchainAccount | undefined;
  /** Network identifier */
  networkId?: NetworkId;
  /** Whether to skip initial fetch */
  skip?: boolean;
}

/**
 * Return type for the useBalance hook
 */
export interface UseBalanceResult {
  /** Wallet balance data */
  balance: WalletBalance | null;
  /** Individual token balances */
  tokens: TokenBalanceWithPrice[];
  /** Total USD value */
  usdTotal: number | undefined;
  /** 24h change percentage */
  changePercent: number | undefined;
  /** 24h change in USD */
  changeAmount: number | undefined;
  /** Whether data is loading */
  loading: boolean;
  /** Whether a refresh is in progress */
  refreshing: boolean;
  /** Error if fetch failed */
  error: string | null;
  /** Whether an error occurred */
  isError: boolean;
  /** Refetch balance data */
  refresh: () => Promise<void>;
  /** Whether balance is hidden */
  hiddenBalance: boolean;
  /** Toggle balance visibility */
  toggleHidden: () => void;
  /** Timestamp of last successful fetch */
  lastUpdated: number | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Cache TTL in milliseconds (60 seconds) */
const CACHE_TTL = 60 * 1000;

// ============================================================================
// Helper Functions
// ============================================================================

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for fetching and managing wallet balance data
 *
 * This hook provides:
 * - SOL and SPL token balances with metadata
 * - USD values and 24h changes
 * - Loading and error states
 * - Refresh capability with 60s cache
 * - Privacy mode toggle
 *
 * @param options - Hook configuration options
 * @returns Balance data and state
 */
export function useBalance({
  account,
  networkId = 'solana-mainnet',
  skip = false,
}: UseBalanceParams): UseBalanceResult {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenBalance, setHiddenBalance] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Cache ref to avoid stale closures — keyed by address:networkId to prevent cross-network stale data
  const cacheRef = useRef<{ data: WalletBalance; timestamp: number; accountKey: string } | null>(null);

  // Track previous account+network to detect changes and reset stale state
  const prevAccountKeyRef = useRef<string | undefined>(undefined);

  // Reset state when account or network changes to prevent stale cross-network data
  useEffect(() => {
    const address = account?.getReceiveAddress();
    const currentKey = address ? `${address}:${networkId}` : undefined;
    if (currentKey !== prevAccountKeyRef.current) {
      prevAccountKeyRef.current = currentKey;
      if (currentKey === undefined) {
        // Account removed — clear state, no loading
        setBalance(null);
        setLoading(false);
      } else if (cacheRef.current?.accountKey !== currentKey) {
        // Different account or network — clear stale data and show loading
        setBalance(null);
        setLoading(true);
        cacheRef.current = null;
      }
    }
  }, [account, networkId]);

  // Load hidden balance preference
  useEffect(() => {
    const loadHiddenPreference = async () => {
      try {
        const hidden = await getStorageItem<boolean>(STORAGE_KEYS.HIDDEN_BALANCE);
        if (hidden !== null) {
          setHiddenBalance(hidden);
        }
      } catch {
        // Ignore storage errors for preference
      }
    };
    loadHiddenPreference();
  }, []);

  /**
   * Toggle balance visibility and persist preference
   */
  const toggleHidden = useCallback(async () => {
    const newValue = !hiddenBalance;
    setHiddenBalance(newValue);
    try {
      await setStorageItem(STORAGE_KEYS.HIDDEN_BALANCE, newValue);
    } catch {
      // Ignore storage errors for preference
    }
  }, [hiddenBalance]);

  /**
   * Fetch Solana balance data via SolanaAccount.getBalance() (DI-backed)
   * Mirrors fetchBitcoinBalance: calls account.getBalance() → transforms to WalletBalance
   */
  const fetchSolanaBalance = useCallback(
    async (solanaAccount: SolanaAccount): Promise<WalletBalance> => {
      try {
        const solanaWalletBalance = await solanaAccount.getBalance();

        const items: TokenBalanceWithPrice[] = solanaWalletBalance.items.map((item) => ({
          mint: item.mint || 'solana',
          owner: solanaAccount.getReceiveAddress(),
          amount: item.amount,
          decimals: item.decimals,
          uiAmount: item.uiAmount || removeDecimals(item.amount, item.decimals),
          symbol: item.symbol,
          name: item.name,
          logo: item.logo || undefined,
          address: item.mint || 'solana',
          coingeckoId: item.coingeckoId || (!item.mint ? 'solana' : undefined),
          tags: item.tags,
          price: item.price,
          usdBalance: item.usdBalance,
          priceChange24h: item.priceChange24h,
        }));

        let last24HoursChangePercent: number | undefined;
        if (
          solanaWalletBalance.usdTotal !== undefined &&
          solanaWalletBalance.last24HoursChange !== undefined &&
          solanaWalletBalance.usdTotal > 0
        ) {
          const previousTotal =
            solanaWalletBalance.usdTotal - solanaWalletBalance.last24HoursChange;
          if (previousTotal > 0) {
            last24HoursChangePercent =
              (solanaWalletBalance.last24HoursChange / previousTotal) * 100;
          }
        }

        return {
          items,
          usdTotal: solanaWalletBalance.usdTotal,
          last24HoursChange: solanaWalletBalance.last24HoursChange,
          last24HoursChangePercent,
        };
      } catch (error) {
        console.warn('[useBalance] Failed to fetch Solana balance:', error);
        return {
          items: [],
          usdTotal: 0,
          last24HoursChange: 0,
          last24HoursChangePercent: 0,
        };
      }
    },
    []
  );

  /**
   * Fetch Bitcoin balance data
   * Calls bitcoinAccount.getBalance() and transforms BitcoinWalletBalance to WalletBalance format
   */
  const fetchBitcoinBalance = useCallback(
    async (bitcoinAccount: BitcoinAccount): Promise<WalletBalance> => {
      try {
        // Fetch Bitcoin wallet balance (includes price data via decorateBalancePrices internally)
        const bitcoinWalletBalance = await bitcoinAccount.getBalance();

        // Transform BitcoinBalanceItem[] to TokenBalanceWithPrice[]
        const items: TokenBalanceWithPrice[] = bitcoinWalletBalance.items.map((item) => ({
          mint: item.mint || 'bitcoin',
          owner: bitcoinAccount.getReceiveAddress(),
          amount: item.amount,
          decimals: item.decimals,
          uiAmount: item.uiAmount || removeDecimals(item.amount, item.decimals),
          symbol: item.symbol,
          name: item.name,
          logo: item.logo || undefined,
          address: item.mint || 'bitcoin',
          coingeckoId: item.coingeckoId || (!item.mint ? 'bitcoin' : undefined),
          price: item.price,
          usdBalance: item.usdBalance,
          priceChange24h: item.priceChange24h,
        }));

        // Calculate 24h change percent if we have the data
        let last24HoursChangePercent: number | undefined;
        if (
          bitcoinWalletBalance.usdTotal !== undefined &&
          bitcoinWalletBalance.last24HoursChange !== undefined &&
          bitcoinWalletBalance.usdTotal > 0
        ) {
          const previousTotal =
            bitcoinWalletBalance.usdTotal - bitcoinWalletBalance.last24HoursChange;
          if (previousTotal > 0) {
            last24HoursChangePercent =
              (bitcoinWalletBalance.last24HoursChange / previousTotal) * 100;
          }
        }

        return {
          items,
          usdTotal: bitcoinWalletBalance.usdTotal,
          last24HoursChange: bitcoinWalletBalance.last24HoursChange,
          last24HoursChangePercent,
        };
      } catch (error) {
        console.warn('[useBalance] Failed to fetch Bitcoin balance:', error);
        return {
          items: [],
          usdTotal: 0,
          last24HoursChange: 0,
          last24HoursChangePercent: 0,
        };
      }
    },
    []
  );

  /**
   * Fetch Ethereum balance data via EthereumAccount.getBalance() (DI-backed)
   * Mirrors fetchBitcoinBalance: calls account.getBalance() → transforms to WalletBalance
   */
  const fetchEthereumBalance = useCallback(
    async (ethereumAccount: EthereumAccount): Promise<WalletBalance> => {
      try {
        const ethereumWalletBalance = await ethereumAccount.getBalance();

        const items: TokenBalanceWithPrice[] = ethereumWalletBalance.items.map((item) => ({
          mint: item.mint || 'ethereum',
          owner: ethereumAccount.getReceiveAddress(),
          amount: item.amount,
          decimals: item.decimals,
          uiAmount: item.uiAmount || removeDecimals(item.amount, item.decimals),
          symbol: item.symbol,
          name: item.name,
          logo: item.logo || undefined,
          address: item.mint || 'ethereum',
          coingeckoId: item.coingeckoId || (!item.mint ? 'ethereum' : undefined),
          price: item.price,
          usdBalance: item.usdBalance,
          priceChange24h: item.priceChange24h,
        }));

        let last24HoursChangePercent: number | undefined;
        if (
          ethereumWalletBalance.usdTotal !== undefined &&
          ethereumWalletBalance.last24HoursChange !== undefined &&
          ethereumWalletBalance.usdTotal > 0
        ) {
          const previousTotal =
            ethereumWalletBalance.usdTotal - ethereumWalletBalance.last24HoursChange;
          if (previousTotal > 0) {
            last24HoursChangePercent =
              (ethereumWalletBalance.last24HoursChange / previousTotal) * 100;
          }
        }

        return {
          items,
          usdTotal: ethereumWalletBalance.usdTotal,
          last24HoursChange: ethereumWalletBalance.last24HoursChange,
          last24HoursChangePercent,
        };
      } catch (error) {
        console.warn('[useBalance] Failed to fetch Ethereum balance:', error);
        return {
          items: [],
          usdTotal: 0,
          last24HoursChange: 0,
          last24HoursChangePercent: 0,
        };
      }
    },
    []
  );

  /**
   * Fetch balance data from the blockchain and API
   * Routes to the appropriate blockchain-specific fetcher based on account type
   */
  const fetchBalance = useCallback(
    async (isRefresh: boolean = false) => {
      if (!account || skip) {
        return;
      }

      // Check cache validity — must match current account+network to prevent cross-network stale data
      const now = Date.now();
      const currentAccountKey = `${account.getReceiveAddress()}:${networkId}`;
      if (
        cacheRef.current &&
        cacheRef.current.accountKey === currentAccountKey &&
        now - cacheRef.current.timestamp < CACHE_TTL &&
        !isRefresh
      ) {
        setBalance(cacheRef.current.data);
        setLastUpdated(cacheRef.current.timestamp);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        let walletBalance: WalletBalance;

        // Route to the appropriate blockchain-specific balance fetcher
        if (isSolanaAccount(account)) {
          walletBalance = await fetchSolanaBalance(account);
        } else if (isBitcoinAccount(account)) {
          walletBalance = await fetchBitcoinBalance(account);
        } else if (isEthereumAccount(account)) {
          walletBalance = await fetchEthereumBalance(account);
        } else {
          // Fallback: treat as Solana for backwards compatibility
          walletBalance = await fetchSolanaBalance(account as SolanaAccount);
        }

        // Update cache with account identity
        cacheRef.current = { data: walletBalance, timestamp: now, accountKey: currentAccountKey };

        setBalance(walletBalance);
        setLastUpdated(now);
      } catch (err) {
        console.error('[useBalance] Failed to fetch balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [account, networkId, skip, fetchSolanaBalance, fetchBitcoinBalance, fetchEthereumBalance]
  );

  // Initial fetch
  useEffect(() => {
    fetchBalance(false);
  }, [fetchBalance]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchBalance(true);
  }, [fetchBalance]);

  // Computed values
  const tokens = balance?.items || [];
  const usdTotal = balance?.usdTotal;
  const changePercent = balance?.last24HoursChangePercent;
  const changeAmount = balance?.last24HoursChange;

  return {
    balance,
    tokens,
    usdTotal,
    changePercent,
    changeAmount,
    loading,
    refreshing,
    error,
    isError: error !== null,
    refresh,
    hiddenBalance,
    toggleHidden,
    lastUpdated,
  };
}

