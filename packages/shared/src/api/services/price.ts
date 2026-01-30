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

// ============================================================================
// Types
// ============================================================================

/**
 * Token price data from the backend
 * Note: Many fields are optional as not all price sources provide full data
 */
export interface TokenPrice {
  /** Token identifier (coingecko ID or address) */
  id: string;
  /** Token symbol (e.g., 'SOL', 'BTC') */
  symbol: string;
  /** Token name */
  name: string;
  /** Current price in USD */
  current_price: number;
  /** 24h price change percentage */
  price_change_percentage_24h: number;
  /** Market capitalization in USD */
  market_cap?: number;
  /** Market cap rank */
  market_cap_rank?: number | null;
  /** Fully diluted valuation */
  fully_diluted_valuation?: number | null;
  /** 24h trading volume */
  total_volume?: number;
  /** 24h high price */
  high_24h?: number;
  /** 24h low price */
  low_24h?: number;
  /** 24h price change in USD */
  price_change_24h?: number;
  /** Market cap change in 24h */
  market_cap_change_24h?: number;
  /** Market cap change percentage in 24h */
  market_cap_change_percentage_24h?: number;
  /** Circulating supply */
  circulating_supply?: number;
  /** Total supply */
  total_supply?: number | null;
  /** Maximum supply */
  max_supply?: number | null;
  /** All-time high price */
  ath?: number;
  /** All-time high change percentage */
  ath_change_percentage?: number;
  /** All-time high date */
  ath_date?: string;
  /** All-time low price */
  atl?: number;
  /** All-time low change percentage */
  atl_change_percentage?: number;
  /** All-time low date */
  atl_date?: string;
  /** Last updated timestamp */
  last_updated?: string;
  /** Token image URL */
  image?: string;
}

/**
 * Top token data with trading metrics
 */
export interface TopToken {
  /** Token address or ID */
  id: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token logo URL */
  logo?: string;
  /** Token icon URL (alternative) */
  icon?: string;
  /** Token address */
  address?: string;
  /** Token decimals */
  decimals?: number;
  /** Current price in USD */
  price?: number;
  /** 24h price change percentage */
  priceChange24h?: number;
  /** 24h trading volume */
  volume24h?: number;
  /** Market cap */
  marketCap?: number;
  /** Tags for categorization */
  tags?: string[];
  /** CoinGecko ID */
  coingeckoId?: string | null;
}

/**
 * Market chart data point
 */
export interface ChartDataPoint {
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Value at this timestamp */
  value: number;
}

/**
 * Market chart response data
 */
export interface MarketChartData {
  /** Price data points [timestamp, price][] */
  prices: [number, number][];
  /** Market cap data points [timestamp, market_cap][] */
  market_caps: [number, number][];
  /** Volume data points [timestamp, volume][] */
  total_volumes: [number, number][];
}

/**
 * Detailed coin information
 */
export interface CoinInfo {
  /** Coin ID */
  id: string;
  /** Coin symbol */
  symbol: string;
  /** Coin name */
  name: string;
  /** Description (localized) */
  description?: { en?: string };
  /** Image URLs */
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  /** Market data */
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    high_24h?: Record<string, number>;
    low_24h?: Record<string, number>;
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    market_cap_change_24h?: number;
    market_cap_change_percentage_24h?: number;
    circulating_supply?: number;
    total_supply?: number | null;
    max_supply?: number | null;
    ath?: Record<string, number>;
    atl?: Record<string, number>;
  };
  /** Links */
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    official_forum_url?: string[];
    twitter_screen_name?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
  };
  /** Categories */
  categories?: string[];
  /** Genesis date */
  genesis_date?: string | null;
}

/**
 * Platform identifier for price queries
 */
export type PricePlatform = 'solana' | 'bitcoin' | 'ethereum' | 'eclipse';

/**
 * Network identifier for Solana token prices
 */
export type NetworkId = 'solana-mainnet' | 'solana-devnet';

// ============================================================================
// In-memory cache for prices
// ============================================================================

interface PriceCache {
  data: TokenPrice[] | null;
  timestamp: number;
}

const priceCache: Map<PricePlatform, PriceCache> = new Map();
const CACHE_TTL_MS = 60000; // 1 minute cache

function getCachedPrices(platform: PricePlatform): TokenPrice[] | null {
  const cached = priceCache.get(platform);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCachedPrices(platform: PricePlatform, data: TokenPrice[]): void {
  priceCache.set(platform, { data, timestamp: Date.now() });
}

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
  // Check cache first
  const cached = getCachedPrices(platform);
  if (cached) {
    return cached;
  }

  try {
    const { data } = await staticApiClient.get<TokenPrice[]>(`/v1/coins/${platform}`);

    if (Array.isArray(data)) {
      setCachedPrices(platform, data);
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
 * @returns USD price or null if not found
 */
export async function getSolanaTokenPrice(
  mintAddress: string,
  networkId: NetworkId = 'solana-mainnet'
): Promise<number | null> {
  try {
    const { data } = await apiClient.get<{ usdPrice?: number }>(
      `/v1/${networkId}/ft/price/${mintAddress}`
    );
    return data?.usdPrice ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      // Token not found, return null silently
      return null;
    }
    console.error(`[PriceService] Failed to fetch price for ${mintAddress}:`, error);
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
  platforms: PricePlatform[];
  entries: number;
} {
  const platforms = Array.from(priceCache.keys());
  return {
    platforms,
    entries: platforms.length,
  };
}
