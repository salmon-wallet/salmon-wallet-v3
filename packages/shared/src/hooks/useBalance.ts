/**
 * useBalance Hook
 *
 * Provides wallet balance data with automatic refresh and caching.
 * Supports multiple blockchain types: Solana, Bitcoin, and Ethereum.
 *
 * For Solana: Fetches both native SOL balance and SPL token balances,
 * decorates them with metadata and prices, and calculates portfolio totals.
 *
 * For Bitcoin: Fetches BTC balance via BitcoinAccount.getBalance() and
 * transforms BitcoinWalletBalance to WalletBalance format with USD values.
 *
 * For Ethereum: Fetches native ETH balance via the balance service and
 * decorates with price data from the price service.
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
 *   networkId: 'mainnet-beta',
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { SolanaAccount } from '../blockchain/solana';
import type { BitcoinAccount } from '../blockchain/bitcoin';
import type { EthereumAccount } from '../blockchain/ethereum';

/**
 * Union type for all supported blockchain account types.
 * This allows useBalance to work with any supported blockchain.
 */
export type BlockchainAccount = SolanaAccount | BitcoinAccount | EthereumAccount;
import {
  getWalletBalance,
  createSolBalance,
  calculate24HoursChange,
  type WalletBalance,
  type RawTokenBalance,
  type TokenBalanceWithPrice,
} from '../api/services/balance';
import { getPricesByPlatform } from '../api/services/price';
import { getEthBalance, ETH_CONSTANTS } from '../blockchain/ethereum/balance';
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
// Account Type Detection
// ============================================================================

/**
 * Type of blockchain for account routing
 */
type BlockchainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Detects the blockchain type from an account instance.
 * Uses duck typing to identify the account type based on characteristic methods/properties.
 *
 * @param account - The blockchain account to identify
 * @returns The blockchain type ('solana', 'bitcoin', or 'ethereum')
 */
function getAccountBlockchainType(account: BlockchainAccount): BlockchainType {
  // Check for SolanaAccount - has getConnection that returns Connection (Solana-specific)
  // and getPublicKey returns PublicKey (Solana type)
  if ('getConnection' in account && 'getPublicKey' in account) {
    const publicKey = account.getPublicKey();
    // SolanaAccount.getPublicKey() returns PublicKey (an object with toBase58 method)
    // EthereumAccount.getPublicKey() returns a string (hex)
    // BitcoinAccount.getPublicKey() returns Uint8Array
    if (typeof publicKey === 'object' && publicKey !== null && 'toBase58' in publicKey) {
      return 'solana';
    }
    // EthereumAccount has getConnection but getPublicKey returns string
    if (typeof publicKey === 'string') {
      return 'ethereum';
    }
  }

  // Check for BitcoinAccount - has keyPair property with address
  if ('keyPair' in account) {
    return 'bitcoin';
  }

  // Check for EthereumAccount - has wallet property
  if ('wallet' in account) {
    return 'ethereum';
  }

  // Default to Solana for backwards compatibility
  return 'solana';
}

/**
 * Type guard to check if account is a SolanaAccount
 */
function isSolanaAccount(account: BlockchainAccount): account is SolanaAccount {
  return getAccountBlockchainType(account) === 'solana';
}

/**
 * Type guard to check if account is a BitcoinAccount
 */
function isBitcoinAccount(account: BlockchainAccount): account is BitcoinAccount {
  return getAccountBlockchainType(account) === 'bitcoin';
}

/**
 * Type guard to check if account is an EthereumAccount
 */
function isEthereumAccount(account: BlockchainAccount): account is EthereumAccount {
  return getAccountBlockchainType(account) === 'ethereum';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes network ID to API format (for Solana)
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
   * Fetch Solana balance data from the blockchain and API
   */
  const fetchSolanaBalance = useCallback(
    async (solanaAccount: SolanaAccount): Promise<WalletBalance> => {
      // Get connection from account
      const connection = await solanaAccount.getConnection();
      const publicKey = solanaAccount.getPublicKey();
      const address = solanaAccount.getReceiveAddress();

      // Fetch native SOL balance
      const solBalance = await solanaAccount.getBalance();
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

      return walletBalance;
    },
    [networkId]
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
          uiAmount: item.uiAmount || item.amount / Math.pow(10, item.decimals),
          symbol: item.symbol,
          name: item.name,
          logo: item.logo || null,
          address: item.mint || 'bitcoin',
          coingeckoId: item.coingeckoId || 'bitcoin',
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
   * Fetch Ethereum balance data
   * Calls ethereumAccount.getBalance() and transforms EthereumBalance to WalletBalance format.
   * Also fetches ETH price from the price service for USD calculations.
   */
  const fetchEthereumBalance = useCallback(
    async (ethereumAccount: EthereumAccount): Promise<WalletBalance> => {
      try {
        // Get the provider for token balance fetching
        const provider = await ethereumAccount.getProvider();
        const walletAddress = ethereumAccount.getReceiveAddress();

        // Fetch ETH balance and prices in parallel
        const [ethBalance, prices] = await Promise.all([
          getEthBalance(provider, walletAddress),
          getPricesByPlatform('ethereum'),
        ]);

        // Find ETH price from the price data
        let ethPrice: number | undefined;
        let ethPriceChange24h: number | undefined;

        if (prices) {
          const ethPriceData = prices.find(
            (p) => p.id.toLowerCase() === 'ethereum' || p.symbol.toLowerCase() === 'eth'
          );
          if (ethPriceData) {
            ethPrice = ethPriceData.current_price;
            ethPriceChange24h = ethPriceData.price_change_percentage_24h;
          }
        }

        // Calculate USD balance for ETH
        const ethUiAmount = parseFloat(ethBalance.formattedBalance);
        const ethUsdBalance = ethPrice ? ethUiAmount * ethPrice : undefined;

        // Create ETH token balance entry
        const ethTokenBalance: TokenBalanceWithPrice = {
          mint: ETH_CONSTANTS.ADDRESS || 'ethereum',
          owner: walletAddress,
          amount: ethBalance.balance.toString(),
          decimals: ETH_CONSTANTS.DECIMALS,
          uiAmount: ethUiAmount,
          symbol: ETH_CONSTANTS.SYMBOL,
          name: ETH_CONSTANTS.NAME,
          logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          address: ETH_CONSTANTS.ADDRESS || 'ethereum',
          coingeckoId: ETH_CONSTANTS.COINGECKO_ID,
          price: ethPrice,
          usdBalance: ethUsdBalance,
          priceChange24h: ethPriceChange24h,
        };

        // For now, we only fetch native ETH balance
        // ERC20 token support can be added in a future phase by calling getEthereumTokenBalances
        // with a list of known token addresses
        const items: TokenBalanceWithPrice[] = [ethTokenBalance];

        // Calculate totals
        const usdTotal = items.reduce((sum, item) => sum + (item.usdBalance || 0), 0);

        // Calculate 24h change
        const { amount: last24HoursChange, percent: last24HoursChangePercent } =
          calculate24HoursChange(items, usdTotal);

        return {
          items,
          usdTotal,
          last24HoursChange,
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
    [account, skip, fetchSolanaBalance, fetchBitcoinBalance, fetchEthereumBalance]
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
