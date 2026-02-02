import type { CSSProperties } from 'react';

/**
 * Time period options for price chart
 */
export type PriceChartPeriod = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y' | 'All';

/**
 * Single data point in price history
 */
export interface PriceDataPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Price value at this timestamp */
  price: number;
}

/**
 * Props for the PriceChart component
 */
export interface PriceChartProps {
  /** Price history data points */
  data: PriceDataPoint[];
  /** Currently selected time period */
  selectedPeriod: PriceChartPeriod;
  /** Callback when time period is changed */
  onPeriodChange: (period: PriceChartPeriod) => void;
  /** Whether the chart is in loading state */
  loading?: boolean;
  /** Custom line color (defaults to green for positive, red for negative) */
  color?: string;
  /** Chart height in pixels (default: 200) */
  height?: number;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Available time periods for the chart
 */
export const PRICE_CHART_PERIODS: PriceChartPeriod[] = [
  '1H',
  '1D',
  '1W',
  '1M',
  '3M',
  '1Y',
  'All',
];
