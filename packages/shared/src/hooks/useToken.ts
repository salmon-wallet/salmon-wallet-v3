/**
 * useToken Hook
 * Migrated from salmon-wallet-v2/src/hooks/useToken.js
 *
 * Provides token information and balance for a specific token address.
 * Fetches token metadata and balance data, combining them into a unified response.
 *
 * @example
 * ```tsx
 * const { token, loading, error } = useToken({
 *   tokenId: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   walletAddress: 'YOUR_WALLET_ADDRESS',
 *   networkId: 'solana-mainnet',
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getTokenByAddress } from '../api/services/tokens';
import type { TokenMetadata } from '../types/token';
import type { SolanaNetworkId } from '../types/blockchain';
import { TokenBalanceWithPrice } from '../utils/balance';

// ============================================================================
// Types
// ============================================================================

/**
 * Token data combining metadata and balance information
 */
export interface TokenData extends Partial<TokenMetadata> {
  /** Token mint address */
  address: string;
  /** Token symbol (e.g., 'SOL', 'USDC') */
  symbol?: string;
  /** Token name */
  name?: string;
  /** Token decimals */
  decimals?: number;
  /** Token logo URL */
  logo?: string;
  /** CoinGecko ID for price lookups */
  coingeckoId?: string;
  /** Token tags for categorization */
  tags?: string[];
  /** Human-readable balance */
  uiAmount?: number;
  /** Raw balance amount */
  amount?: string | number;
  /** Current price in USD */
  price?: number;
  /** Balance value in USD */
  usdBalance?: number;
  /** 24h price change percentage */
  priceChange24h?: number;
}

/**
 * Options for the useToken hook
 */
export interface UseTokenParams {
  /** Token mint address to fetch */
  tokenId: string;
  /** Network identifier */
  networkId?: SolanaNetworkId;
  /** Optional: Pre-loaded balance items to search from */
  balanceItems?: TokenBalanceWithPrice[];
  /** Skip fetching metadata (useful when only balance is needed from balanceItems) */
  skipMetadataFetch?: boolean;
}

/**
 * Return type for the useToken hook
 */
export interface UseTokenResult {
  /** Token information (empty object if not found) */
  token: TokenData;
  /** Whether data has been loaded */
  loaded: boolean;
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: string | null;
  /** Whether an error occurred */
  isError: boolean;
  /** Refetch token data */
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to fetch and manage token information
 *
 * This hook provides:
 * - Token metadata (symbol, name, decimals, logo)
 * - Balance information if balanceItems are provided
 * - Loading and error states
 * - Refetch capability
 *
 * @param options - Hook configuration options
 * @returns Token data and state
 */
export function useToken({
  tokenId,
  networkId = 'solana-mainnet',
  balanceItems,
  skipMetadataFetch = false,
}: UseTokenParams): UseTokenResult {
  const [token, setToken] = useState<TokenData>({ address: tokenId });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch token data from balance items or API
   */
  const fetchToken = useCallback(async () => {
    if (!tokenId) {
      setToken({ address: '' });
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, try to find token in provided balance items
      if (balanceItems && balanceItems.length > 0) {
        const tokenFromBalance = balanceItems.find(
          (item) =>
            item.address?.toLowerCase() === tokenId.toLowerCase() ||
            item.mint?.toLowerCase() === tokenId.toLowerCase()
        );

        if (tokenFromBalance) {
          setToken({
            address: tokenFromBalance.address || tokenFromBalance.mint,
            symbol: tokenFromBalance.symbol,
            name: tokenFromBalance.name,
            decimals: tokenFromBalance.decimals,
            logo: tokenFromBalance.logo,
            coingeckoId: tokenFromBalance.coingeckoId,
            tags: tokenFromBalance.tags,
            uiAmount: tokenFromBalance.uiAmount,
            amount: tokenFromBalance.amount,
            price: tokenFromBalance.price,
            usdBalance: tokenFromBalance.usdBalance,
            priceChange24h: tokenFromBalance.priceChange24h,
          });
          setLoaded(true);
          setLoading(false);
          return;
        }
      }

      // If not found in balance items and metadata fetch is not skipped,
      // fetch from API
      if (!skipMetadataFetch) {
        const metadata = await getTokenByAddress(tokenId, networkId);

        if (metadata) {
          setToken({
            address: metadata.address,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            logo: metadata.logo,
            coingeckoId: metadata.coingeckoId,
            tags: metadata.tags,
          });
        } else {
          // Token not found, set minimal info
          setToken({ address: tokenId });
        }
      } else {
        // No balance found and metadata fetch skipped
        setToken({ address: tokenId });
      }

      setLoaded(true);
    } catch (err) {
      console.error('[useToken] Error fetching token:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token');
      setToken({ address: tokenId });
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [tokenId, networkId, balanceItems, skipMetadataFetch]);

  // Fetch token on mount and when dependencies change
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loaded,
    loading,
    error,
    isError: error !== null,
    refetch: fetchToken,
  };
}

