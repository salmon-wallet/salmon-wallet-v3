import type { ViewStyle } from 'react-native';
import type { NetworkInfo } from '@salmon/shared';

/**
 * Supported blockchain types for the carousel
 */
export type BlockchainId =
  | 'solana' | 'solana-devnet' | 'solana-testnet'
  | 'bitcoin' | 'bitcoin-testnet' | 'bitcoin-regtest'
  | 'ethereum' | 'ethereum-sepolia' | 'ethereum-goerli';

/**
 * Extended network info with blockchain type
 */
export interface BlockchainNetworkInfo extends NetworkInfo {
  /** Blockchain identifier for theming */
  blockchain: BlockchainId;
}

/**
 * Balance data for a single blockchain in the carousel
 */
export interface BlockchainBalance {
  /** Blockchain/network information */
  network: BlockchainNetworkInfo;
  /** Total balance in USD */
  usdTotal: number | undefined;
  /** 24-hour change percentage */
  changePercent?: number;
  /** 24-hour change in USD */
  changeAmount?: number;
  /** Whether data is loading */
  loading?: boolean;
}

/**
 * Props for the BalanceCardCarousel component
 */
export interface BalanceCardCarouselProps {
  /** Array of blockchain balances to display */
  blockchains: BlockchainBalance[];
  /** Whether balance is hidden (privacy mode) */
  hiddenBalance?: boolean;
  /** Callback when eye icon is pressed */
  onToggleVisibility?: () => void;
  /** Callback when user swipes to a different blockchain */
  onBlockchainChange?: (blockchain: BlockchainId, index: number) => void;
  /** Currently active blockchain index (controlled mode) */
  activeIndex?: number;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the BalanceCardSkeleton component
 */
export interface BalanceCardSkeletonProps {
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Whether to animate the skeleton (default: true) */
  animated?: boolean;
}

/**
 * Props for the BalanceCard component
 */
export interface BalanceCardProps {
  /** Current network information */
  network: NetworkInfo;
  /** Blockchain identifier for theming (optional, defaults to 'solana') */
  blockchain?: BlockchainId;
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
  style?: ViewStyle;
}
