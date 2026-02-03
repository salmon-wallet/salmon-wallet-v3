/**
 * Shared UI types for @salmon/shared
 * Used by both @salmon/ui (React Native) and @salmon/ui-extension (React DOM)
 */

// ============================================================================
// Network Types
// ============================================================================

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

// ============================================================================
// Token Types
// ============================================================================

/**
 * Token data structure representing a cryptocurrency token
 * Base interface used by both mobile and extension
 */
export interface Token {
  /** Unique token address/mint */
  address: string;
  /** Token display name */
  name: string;
  /** Token symbol (e.g., 'SOL', 'ETH') */
  symbol: string;
  /** Token logo URL */
  logo?: string;
  /** Current price per token in USD */
  price?: number;
  /** User's token balance (formatted for display) */
  uiAmount: string | number;
  /** User's token balance in USD */
  usdBalance?: number | null;
  /** 24-hour price change information */
  last24HoursChange?: {
    /** Percentage change */
    perc: number;
    /** Absolute change in USD */
    abs?: number;
  } | null;
  /** Token tags (e.g., 'verified', 'strict', 'community') */
  tags?: string[];
  /** Whether the token is verified (has 'verified' or 'strict' tag) */
  isVerified?: boolean;
}

// ============================================================================
// Price Chart Types
// ============================================================================

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

// ============================================================================
// Loading Screen Types
// ============================================================================

/**
 * Base props for LoadingScreen component (platform-agnostic)
 */
export interface LoadingScreenBaseProps {
  /** Whether the loading screen is visible */
  visible: boolean;
  /** Optional title to display */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Custom tips to cycle through (defaults to wallet tips) */
  tips?: string[];
  /** Interval in ms to change tips (default: 4000) */
  tipInterval?: number;
  /** Whether to show tips (default: true) */
  showTips?: boolean;
  /** Custom logo size (default: 100) */
  logoSize?: number;
  /** Custom spinner size (default: 140) */
  spinnerSize?: number;
}

/**
 * Default security tips to display on loading screens
 */
export const DEFAULT_WALLET_TIPS = [
  'Never share your seed phrase with anyone',
  'Always verify transaction details before signing',
  'Keep your recovery phrase in a safe place offline',
  'Enable biometric authentication for extra security',
  'Double-check wallet addresses before sending',
  'Your keys, your crypto - stay in control',
  'Bookmark official sites to avoid phishing',
  'Start with small test transactions',
  'Keep your app updated for security patches',
  'Use a hardware wallet for large holdings',
] as const;

// ============================================================================
// Token Features Types
// ============================================================================

/**
 * Individual token feature/characteristic
 */
export interface TokenFeature {
  /** Feature name (e.g., "Native Token", "DeFi", "Governance") */
  label: string;
  /** Optional icon name */
  icon?: string;
  /** Badge background color (defaults to accent color) */
  color?: string;
}
