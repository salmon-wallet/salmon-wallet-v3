import type { CSSProperties } from 'react';

/**
 * Market data for a token
 */
export interface MarketData {
  /** Current price in USD */
  currentPrice?: number;
  /** Market capitalization in USD */
  marketCap?: number;
  /** Market cap rank */
  marketCapRank?: number | null;
  /** 24-hour trading volume in USD */
  volume24h?: number;
  /** 24h high price */
  high24h?: number;
  /** 24h low price */
  low24h?: number;
  /** Circulating supply */
  circulatingSupply?: number;
  /** Total supply */
  totalSupply?: number | null;
  /** Maximum supply (if applicable) */
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
 * Props for the TokenMarketData component
 */
export interface TokenMarketDataProps {
  /** Market data object */
  data?: MarketData;
  /** Token symbol for display (e.g., "BTC", "SOL") */
  symbol?: string;
  /** Title text (default: "Info") */
  title?: string;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional className for the container */
  className?: string;
}
