import type { CSSProperties } from 'react';
import type { Token, PriceChartPeriod, PriceDataPoint, CoinInfo } from '@salmon/shared';
import type { MarketData } from '../TokenMarketData';

// Re-export CoinInfo for consumers
export type { CoinInfo };

/**
 * Props for the TokenInformationSheet component
 * Dialog that appears when a token is tapped to show detailed token information
 */
export interface TokenInformationSheetProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Token data to display */
  token: Token;
  /** Chart price data points */
  chartData: PriceDataPoint[];
  /** Currently selected chart period */
  chartPeriod: PriceChartPeriod;
  /** Callback when chart period changes */
  onChartPeriodChange: (period: PriceChartPeriod) => void;
  /** Coin information (description, categories, etc.) */
  coinInfo: CoinInfo | null;
  /** Market data (market cap, volume, etc.) */
  marketData: MarketData | undefined;
  /** Whether data is loading */
  loading?: boolean;
  /** Optional custom styles for the dialog paper */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for the TokenBadgesSection component
 */
export interface TokenBadgesSectionProps {
  /** Array of token tags to display as badges */
  tags?: string[];
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
