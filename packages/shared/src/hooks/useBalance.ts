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
 *   networkId: 'solana-mainnet',
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import type { SolanaAccount } from '../blockchain/solana';
import type { BitcoinAccount } from '../blockchain/bitcoin';
import type { EthereumAccount } from '../blockchain/ethereum';
import type { BlockchainAccount, NetworkId } from '../types/blockchain';
import { isSolanaAccount, isBitcoinAccount, isEthereumAccount } from '../utils/account';
import { removeDecimals } from '../utils/decimals';

// Re-export domain types for backward compatibility
export type { BlockchainAccount } from '../types/blockchain';
export type { NetworkId } from '../types/blockchain';
import { getWalletBalance } from '../api/services/balance';
import {
  createSolBalance,
  calculate24HoursChange,
  type WalletBalance,
  type RawTokenBalance,
  type TokenBalanceWithPrice,
} from '../utils/balance';
import { getPricesByPlatform } from '../api/services/price';
import { getERC20TokenBalances } from '../api/services/ethereum';
import { getEthBalance } from '../blockchain/ethereum/balance';
import { ETH_CONSTANTS } from '../utils/tokens';
import { detectAllTokens, type EthereumTokenBalance as EthTokenBalance } from '../blockchain/ethereum/tokens';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

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
  networkId = 'solana-mainnet',
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
      // networkId is safe to narrow here because fetchSolanaBalance is only called for Solana accounts
      const walletBalance = await getWalletBalance(
        solTokenBalance,
        tokenBalances,
        networkId as 'solana-mainnet' | 'solana-devnet'
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
          uiAmount: item.uiAmount || removeDecimals(item.amount, item.decimals),
          symbol: item.symbol,
          name: item.name,
          logo: item.logo || undefined,
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
   * Uses automatic ERC-20 token detection to find ALL tokens the user holds,
   * not just featured tokens. This provides MetaMask-like token discovery.
   */
  const fetchEthereumBalance = useCallback(
    async (ethereumAccount: EthereumAccount): Promise<WalletBalance> => {
      try {
        // Get the provider and wallet address
        const provider = await ethereumAccount.getProvider();
        const walletAddress = ethereumAccount.getReceiveAddress();
        const networkId = ethereumAccount.network?.id || 'ethereum';

        // Fetch ETH balance, auto-detect all ERC-20 tokens, and get prices in parallel
        // detectAllTokens automatically finds ALL tokens the user holds via API indexing
        // and falls back to featured tokens if the API is unavailable
        const [ethBalance, tokenDetectionResult, prices] = await Promise.all([
          getEthBalance(provider, walletAddress),
          detectAllTokens(provider, walletAddress, networkId, getERC20TokenBalances),
          getPricesByPlatform('ethereum'),
        ]);

        // Log detection method for debugging
        if (tokenDetectionResult.usedAutomaticDetection) {
          console.debug(
            `[useBalance] Auto-detected ${tokenDetectionResult.detectedTokens.length} ERC-20 tokens for ${walletAddress}`
          );
        } else {
          console.debug(
            `[useBalance] Using featured token fallback, found ${tokenDetectionResult.featuredTokens.length} tokens`
          );
        }

        // Create price lookup maps
        const priceByCoingeckoId = new Map<string, { usdPrice: number; priceChange24h: number | null }>();
        const priceBySymbol = new Map<string, { usdPrice: number; priceChange24h: number | null }>();

        if (prices) {
          prices.forEach((p) => {
            priceByCoingeckoId.set(p.id.toLowerCase(), {
              usdPrice: p.usdPrice,
              priceChange24h: p.perc24HoursChange,
            });
            if (p.symbol) {
              priceBySymbol.set(p.symbol.toLowerCase(), {
                usdPrice: p.usdPrice,
                priceChange24h: p.perc24HoursChange,
              });
            }
          });
        }

        // Find ETH price
        const ethPriceData = priceByCoingeckoId.get('ethereum') || priceBySymbol.get('eth');
        const ethPrice = ethPriceData?.usdPrice;
        const ethPriceChange24h = ethPriceData?.priceChange24h ?? undefined;

        // Calculate USD balance for ETH
        const ethUiAmount = parseFloat(ethBalance.formattedBalance);
        const ethUsdBalance = ethPrice ? ethUiAmount * ethPrice : undefined;

        // Create ETH token balance entry (always first)
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

        // Convert auto-detected ERC-20 balances to TokenBalanceWithPrice format
        const erc20Items: TokenBalanceWithPrice[] = tokenDetectionResult.allTokens.map((token: EthTokenBalance) => {
          // Find price by coingeckoId first, then by symbol
          const coingeckoId = token.coingeckoId;

          let tokenPriceData = coingeckoId
            ? priceByCoingeckoId.get(coingeckoId.toLowerCase())
            : undefined;

          if (!tokenPriceData) {
            tokenPriceData = priceBySymbol.get(token.symbol.toLowerCase());
          }

          const tokenPrice = tokenPriceData?.usdPrice;
          const tokenPriceChange24h = tokenPriceData?.priceChange24h ?? undefined;
          const tokenUiAmount = parseFloat(token.uiAmount);
          const tokenUsdBalance = tokenPrice ? tokenUiAmount * tokenPrice : undefined;

          return {
            mint: token.address,
            owner: walletAddress,
            amount: token.balance.toString(),
            decimals: token.decimals,
            uiAmount: tokenUiAmount,
            symbol: token.symbol,
            name: token.name,
            logo: token.logoUri || undefined,
            address: token.address,
            coingeckoId: coingeckoId,
            price: tokenPrice,
            usdBalance: tokenUsdBalance,
            priceChange24h: tokenPriceChange24h,
          };
        });

        // Combine ETH + ERC-20 tokens, sort by USD balance (ETH always first)
        const allItems = [ethTokenBalance, ...erc20Items];
        const sortedItems = allItems.sort((a, b) => {
          // ETH always first
          if (a.symbol === 'ETH') return -1;
          if (b.symbol === 'ETH') return 1;
          // Then by USD balance descending
          return (b.usdBalance || 0) - (a.usdBalance || 0);
        });

        // Calculate totals
        const usdTotal = sortedItems.reduce((sum, item) => sum + (item.usdBalance || 0), 0);

        // Calculate 24h change
        const { amount: last24HoursChange, percent: last24HoursChangePercent } =
          calculate24HoursChange(sortedItems, usdTotal);

        return {
          items: sortedItems,
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
      if (!account || skip) {
        return;
      }

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
