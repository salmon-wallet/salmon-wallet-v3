import type { ViewStyle } from 'react-native';
import type { Token, PriceChartPeriod, PriceDataPoint, CoinInfo } from '@salmon/shared';
import type { MarketData } from '../TokenMarketData';

// Re-export CoinInfo for consumers
export type { CoinInfo };

/**
 * Props for the TokenInformationSheet component
 * Bottom sheet that appears when a token is tapped
 */
export interface TokenInformationSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet is closed */
  onClose: () => void;
  /** Token data to display */
  token: Token;
  /** Blockchain type for styling */
  blockchain?: 'solana' | 'bitcoin' | 'ethereum';
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
  /** Optional custom styles for the container */
  style?: ViewStyle;
}
