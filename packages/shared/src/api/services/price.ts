/**
 * Price Service
 * Migrated from salmon-wallet-v2/src/adapter/services/price-service.js
 *
 * Provides price data for tokens across different platforms.
 *
 * API Endpoints:
 * - GET /v1/coins/{platform} - Get all coin prices for a platform (static API)
 * - GET /v1/top-tokens - Get top tokens by market activity
 * - GET /v1/{networkId}/ft/price/{mintAddress} - Get specific token price (Jupiter Price API v3)
 * - GET /v1/chart/{coinId} - Get market chart data (price history)
 * - GET /v1/coin/{coinId} - Get detailed coin info
 */

import { apiClient, staticApiClient, ApiError } from '../client';
import { SmartCache } from '../../utils/cache';
import type { SolanaNetworkId } from '../../types/blockchain';
import type {
  TokenPrice,
  TopToken,
  MarketChartData,
  CoinInfo,
  PricePlatform,
  JupiterApiPriceData,
} from '../../types/price';

// ============================================================================
// In-memory cache for prices
// ============================================================================

const priceCache = new SmartCache<TokenPrice[]>({ maxSize: 10, ttl: 60000 });

// ============================================================================
// Price Service Functions
// ============================================================================

/**
 * Get all prices for a platform (e.g., 'solana')
 *
 * Endpoint: GET /v1/coins/{platform} (static API)
 *
 * @param platform - Platform identifier
 * @returns Array of token prices or null if unavailable
 */
export async function getPricesByPlatform(platform: PricePlatform): Promise<TokenPrice[] | null> {
  const cached = priceCache.get(platform);
  if (cached) {
    return cached;
  }

  try {
    const { data } = await staticApiClient.get<TokenPrice[]>(`/v1/coins/${platform}`);

    if (Array.isArray(data)) {
      priceCache.set(platform, data);
      return data;
    }

    return null;
  } catch (error) {
    console.error(`[PriceService] Failed to fetch prices for ${platform}:`, error);
    return null;
  }
}

/**
 * Get prices by CoinGecko IDs
 *
 * @param ids - Array of CoinGecko coin IDs
 * @param platform - Platform to filter by (default: 'solana')
 * @returns Array of token prices for the specified IDs
 */
export async function getPricesByIds(
  ids: string[],
  platform: PricePlatform = 'solana'
): Promise<TokenPrice[] | null> {
  const allPrices = await getPricesByPlatform(platform);

  if (!allPrices) {
    return null;
  }

  const idSet = new Set(ids.map((id) => id.toLowerCase()));
  return allPrices.filter((price) => idSet.has(price.id.toLowerCase()));
}

/**
 * Get top tokens by market activity
 *
 * Endpoint: GET /v1/top-tokens
 *
 * @param platform - Platform to filter by
 * @returns Array of top tokens
 */
export async function getTopTokensByPlatform(platform: PricePlatform): Promise<TopToken[]> {
  try {
    const { data } = await apiClient.get<TopToken[]>('/v1/top-tokens', {
      params: { platform },
    });
    return data || [];
  } catch (error) {
    console.error(`[PriceService] Failed to fetch top tokens for ${platform}:`, error);
    return [];
  }
}

/**
 * Get price for a specific Solana token from Jupiter Price API v3
 * Uses backend endpoint with caching and rate limiting
 *
 * Endpoint: GET /v1/{networkId}/ft/price/{mintAddress}
 *
 * @param mintAddress - Solana token mint address
 * @param networkId - Network ID (default: 'solana-mainnet')
 * @returns Price data with usdPrice and priceChange24h, or null if not found
 */
export async function getSolanaTokenPrice(
  mintAddress: string,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<JupiterApiPriceData | null> {
  try {
    const { data } = await apiClient.get<{ usdPrice?: number; priceChange24h?: number | null }>(
      `/v1/${networkId}/ft/price/${mintAddress}`
    );
    if (data?.usdPrice !== undefined) {
      return {
        usdPrice: data.usdPrice,
        priceChange24h: data.priceChange24h ?? null,
      };
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      // Token not found — no known price, skip CoinGecko fallback
      return null;
    }
    console.error(`[PriceService] Failed to fetch price for ${mintAddress}:`, error);

    // Fallback: try CoinGecko static API for non-404 errors
    try {
      const fallback = await findTokenPrice(mintAddress, 'solana');
      if (fallback) {
        return {
          usdPrice: fallback.usdPrice,
          priceChange24h: fallback.perc24HoursChange,
        };
      }
    } catch (fallbackError) {
      console.error(`[PriceService] CoinGecko fallback also failed for ${mintAddress}:`, fallbackError);
    }

    return null;
  }
}

/**
 * Get market chart data for a coin (price history)
 *
 * Endpoint: GET /v1/chart/{coinId}
 *
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin', 'solana')
 * @param days - Number of days (1, 7, 30, 90, 365)
 * @param currency - Currency for prices (default: 'usd')
 * @returns Chart data with prices, marketCaps, totalVolumes or null
 */
export async function getMarketChart(
  coinId: string,
  days: 1 | 7 | 30 | 90 | 365 = 7,
  currency: string = 'usd'
): Promise<MarketChartData | null> {
  try {
    const { data } = await apiClient.get<MarketChartData>(`/v1/chart/${coinId}`, {
      params: { days, currency },
    });
    return data;
  } catch (error) {
    console.error(`[PriceService] Failed to fetch chart for ${coinId}:`, error);
    return null;
  }
}

/**
 * Get coin info (price, market cap, supply, description)
 *
 * Endpoint: GET /v1/coin/{coinId}
 *
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin', 'solana')
 * @param currency - Currency for prices (default: 'usd')
 * @returns Coin info with marketData or null
 */
export async function getCoinInfo(
  coinId: string,
  currency: string = 'usd'
): Promise<CoinInfo | null> {
  try {
    const { data } = await apiClient.get<CoinInfo>(`/v1/coin/${coinId}`, {
      params: { currency },
    });
    return data;
  } catch (error) {
    console.error(`[PriceService] Failed to fetch coin info for ${coinId}:`, error);
    return null;
  }
}

/**
 * Find price data for a token by address or symbol
 *
 * @param addressOrSymbol - Token address or symbol to search for
 * @param platform - Platform to search in
 * @returns Token price or null if not found
 */
export async function findTokenPrice(
  addressOrSymbol: string,
  platform: PricePlatform = 'solana'
): Promise<TokenPrice | null> {
  const prices = await getPricesByPlatform(platform);

  if (!prices) {
    return null;
  }

  const searchLower = addressOrSymbol.toLowerCase();

  // Search by ID first (which might be address)
  let found = prices.find((p) => p.id.toLowerCase() === searchLower);

  // Then by symbol
  if (!found) {
    found = prices.find((p) => p.symbol.toLowerCase() === searchLower);
  }

  return found ?? null;
}

/**
 * Clear the price cache for a platform or all platforms
 *
 * @param platform - Optional platform to clear, clears all if not provided
 */
export function clearPriceCache(platform?: PricePlatform): void {
  if (platform) {
    priceCache.delete(platform);
  } else {
    priceCache.clear();
  }
}

/**
 * Get the current cache status
 *
 * @returns Object with cache stats
 */
export function getPriceCacheStatus(): {
  entries: number;
} {
  return {
    entries: priceCache.size,
  };
}
