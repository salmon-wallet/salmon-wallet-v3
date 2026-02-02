/**
 * BalanceCard types for @salmon/ui-extension
 */
import type { CSSProperties } from 'react';

/**
 * Network information for display
 */
export interface NetworkInfo {
  /** Network identifier */
  id: string;
  /** Network display name */
  name: string;
  /** Network logo URL */
  logo?: string;
}

/**
 * Props for the BalanceCard component
 */
export interface BalanceCardProps {
  /** Current network information */
  network: NetworkInfo;
  /** Total balance in USD */
  usdTotal: number | undefined;
  /** 24-hour change percentage */
  changePercent?: number;
  /** 24-hour change in USD */
  changeAmount?: number;
  /** Whether balance is hidden (privacy mode) */
  hiddenBalance?: boolean;
  /** Callback when eye icon is pressed */
  onToggleVisibility?: () => void;
  /** Callback when network selector is pressed (for future multi-network) */
  onNetworkPress?: () => void;
  /** Index for pagination dots (for future multi-network carousel) */
  currentIndex?: number;
  /** Total count for pagination dots */
  totalCount?: number;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
