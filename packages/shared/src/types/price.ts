/**
 * Price-related domain types.
 *
 * Previously defined in api/services/price.ts.
 *
 * @module types/price
 */

// ============================================================================
// Token price data
// ============================================================================

/**
 * Token price data from the backend.
 *
 * Note: The backend uses usdPrice/perc24HoursChange field names
 * (not CoinGecko standard).
 */
export interface TokenPrice {
  /** Token identifier (coingecko ID or address) */
  id: string;
  /** Token symbol (e.g., 'SOL', 'BTC') */
  symbol: string;
  /** Token name */
  name: string;
  /** Current price in USD (backend field name) */
  usdPrice: number;
  /** 24h price change percentage (backend field name, can be null) */
  perc24HoursChange: number | null;
  /** Optional fields that may be present in some responses */
  market_cap?: number;
  market_cap_rank?: number | null;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  circulating_supply?: number;
  total_supply?: number | null;
  max_supply?: number | null;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  last_updated?: string;
  image?: string;
}

// ============================================================================
// Chart & market data
// ============================================================================

/**
 * Market chart data point.
 */
export interface ChartDataPoint {
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Value at this timestamp */
  value: number;
}

/**
 * Market chart response data.
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
 * Market data for a coin.
 */
export interface CoinMarketData {
  /** Current price in USD */
  currentPrice?: number;
  /** 24h price change in USD */
  priceChange24h?: number;
  /** 24h price change percentage */
  priceChangePercentage24h?: number;
  /** Market capitalization */
  marketCap?: number;
  /** Market cap rank */
  marketCapRank?: number | null;
  /** 24h trading volume */
  totalVolume?: number;
  /** 24h high price */
  high24h?: number;
  /** 24h low price */
  low24h?: number;
  /** Circulating supply */
  circulatingSupply?: number;
  /** Total supply */
  totalSupply?: number | null;
  /** Maximum supply */
  maxSupply?: number | null;
  /** All-time high price */
  ath?: number;
  /** ATH change percentage */
  athChangePercentage?: number;
  /** ATH date */
  athDate?: string;
  /** All-time low price */
  atl?: number;
  /** ATL change percentage */
  atlChangePercentage?: number;
  /** ATL date */
  atlDate?: string;
}

/**
 * Links associated with a coin.
 */
export interface CoinLinks {
  /** Homepage URLs */
  homepage?: string[];
  /** Blockchain explorer URLs */
  blockchainSite?: string[];
  /** Official forum URLs */
  officialForumUrl?: string[];
  /** Twitter handle */
  twitterScreenName?: string;
  /** Telegram channel identifier */
  telegramChannelIdentifier?: string;
  /** Subreddit URL */
  subredditUrl?: string;
}

/**
 * Detailed coin information.
 */
export interface CoinInfo {
  /** Coin ID */
  id: string;
  /** Coin symbol */
  symbol: string;
  /** Coin name */
  name: string;
  /** Description text */
  description?: string;
  /** Image URL */
  image?: string;
  /** Market data */
  marketData?: CoinMarketData;
  /** Links */
  links?: CoinLinks;
  /** Categories */
  categories?: string[];
  /** Genesis date */
  genesisDate?: string | null;
}

/**
 * Jupiter price data from the API endpoint.
 *
 * Raw API response format from the Jupiter Price endpoint.
 * Uses `usdPrice` field matching the backend response.
 */
export interface JupiterApiPriceData {
  /** USD price */
  usdPrice: number;
  /** 24h price change percentage (can be null) */
  priceChange24h: number | null;
}

/**
 * Platform identifier for price queries.
 */
export type PricePlatform = 'solana' | 'bitcoin' | 'ethereum';
