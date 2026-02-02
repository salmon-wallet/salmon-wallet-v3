/**
 * useBalance Hook
 *
 * Provides wallet balance data with automatic refresh and caching.
 * Fetches both native SOL balance and SPL token balances, decorates
 * them with metadata and prices, and calculates portfolio totals.
 *
 * Features:
 * - 60-second cache TTL
 * - Pull-to-refresh support
 * - Privacy mode support (hiddenBalance)
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const { balance, loading, error, refresh, hiddenBalance, toggleHidden } = useBalance({
 *   account: activeBlockchainAccount,
 *   networkId: 'mainnet-beta',
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { SolanaAccount } from '../blockchain/solana';
import {
  getWalletBalance,
  createSolBalance,
  type WalletBalance,
  type RawTokenBalance,
  type TokenBalanceWithPrice,
} from '../api/services/balance';
import { getStorageItem, setStorageItem } from '../storage';

// ============================================================================
// Types
// ============================================================================

/**
 * Network ID for balance queries
 */
export type NetworkId = 'solana-mainnet' | 'solana-devnet' | 'mainnet-beta' | 'devnet';

/**
 * Options for the useBalance hook
 */
export interface UseBalanceOptions {
  /** The Solana blockchain account instance */
  account: SolanaAccount | undefined;
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
  error: Error | null;
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

/** Storage key for balance visibility preference */
const HIDDEN_BALANCE_KEY = 'salmon_hidden_balance';

/** Token-2022 program ID */
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes network ID to API format
 */
function normalizeNetworkId(networkId: NetworkId): 'solana-mainnet' | 'solana-devnet' {
  if (networkId === 'mainnet-beta') return 'solana-mainnet';
  if (networkId === 'devnet') return 'solana-devnet';
  return networkId as 'solana-mainnet' | 'solana-devnet';
}

/**
 * Fetches all SPL token balances for a wallet
 */
async function fetchTokenBalances(
  connection: Connection,
  publicKey: PublicKey
): Promise<RawTokenBalance[]> {
  const balances: RawTokenBalance[] = [];

  try {
    // Fetch legacy SPL tokens
    const legacyAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    for (const account of legacyAccounts.value) {
      const { mint, tokenAmount } = account.account.data.parsed.info;
      if (tokenAmount.uiAmount > 0) {
        balances.push({
          mint,
          owner: publicKey.toBase58(),
          amount: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount,
          program: 'spl-token',
        });
      }
    }

    // Fetch Token-2022 tokens
    const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_2022_PROGRAM_ID }
    );

    for (const account of token2022Accounts.value) {
      const { mint, tokenAmount } = account.account.data.parsed.info;
      if (tokenAmount.uiAmount > 0) {
        const extensions = account.account.data.parsed.info.extensions || [];
        balances.push({
          mint,
          owner: publicKey.toBase58(),
          amount: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount,
          program: 'spl-token-2022',
          extensions,
        });
      }
    }
  } catch (error) {
    console.error('[useBalance] Failed to fetch token balances:', error);
    // Return empty array instead of throwing - some wallets may not have tokens
  }

  return balances;
}

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
  networkId = 'mainnet-beta',
  skip = false,
}: UseBalanceOptions): UseBalanceResult {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hiddenBalance, setHiddenBalance] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Cache ref to avoid stale closures
  const cacheRef = useRef<{ data: WalletBalance; timestamp: number } | null>(null);

  // Load hidden balance preference
  useEffect(() => {
    const loadHiddenPreference = async () => {
      try {
        const hidden = await getStorageItem<boolean>(HIDDEN_BALANCE_KEY);
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
      await setStorageItem(HIDDEN_BALANCE_KEY, newValue);
    } catch {
      // Ignore storage errors for preference
    }
  }, [hiddenBalance]);

  /**
   * Fetch balance data from the blockchain and API
   */
  const fetchBalance = useCallback(
    async (isRefresh: boolean = false) => {
      if (!account || skip) return;

      // Check cache validity
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.timestamp < CACHE_TTL && !isRefresh) {
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
        // Get connection from account
        const connection = await account.getConnection();
        const publicKey = account.getPublicKey();
        const address = account.getReceiveAddress();

        // Fetch native SOL balance
        const solBalance = await account.getBalance();
        const solTokenBalance = createSolBalance(Number(solBalance.lamports), address);

        // Fetch SPL token balances
        const tokenBalances = await fetchTokenBalances(connection, publicKey);

        // Get complete wallet balance with prices
        const normalizedNetworkId = normalizeNetworkId(networkId);
        const walletBalance = await getWalletBalance(
          solTokenBalance,
          tokenBalances,
          normalizedNetworkId
        );

        // Update cache
        cacheRef.current = { data: walletBalance, timestamp: now };

        setBalance(walletBalance);
        setLastUpdated(now);
      } catch (err) {
        console.error('[useBalance] Failed to fetch balance:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [account, networkId, skip]
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
    refresh,
    hiddenBalance,
    toggleHidden,
    lastUpdated,
  };
}

export default useBalance;
