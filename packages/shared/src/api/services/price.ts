/**
 * Price Service
 *
 * Cross-platform price data backed by the static-API CoinGecko mirror,
 * plus market chart and coin info endpoints. Solana per-mint pricing
 * lives in `balance.ts:getJupiterPrices` (single batch call to
 * `/v1/<networkId>/ft/price/batch`); this module does not own that
 * endpoint.
 *
 * API endpoints used here:
 * - GET /v1/coins/{platform} - All coin prices for a platform (static API)
 * - GET /v1/chart/{coinId}   - Market chart data (price history)
 * - GET /v1/coin/{coinId}    - Detailed coin info
 */

import { apiClient, staticApiClient } from '../client';
import { SmartCache } from '../../utils/cache';
import type {
  TokenPrice,
  MarketChartData,
  CoinInfo,
  PricePlatform,
} from '../../types/price';

// ============================================================================
// In-memory cache for prices
// ============================================================================

const priceCache = new SmartCache<TokenPrice[]>({ maxSize: 10, ttl: 300000 });

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
