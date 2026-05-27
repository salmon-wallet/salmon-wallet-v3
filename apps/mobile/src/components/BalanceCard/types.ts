import type { ViewStyle } from 'react-native';
import type {
  BlockchainId,
  BlockchainNetworkInfo,
  BlockchainBalance,
  BalanceCardPropsBase,
  BalanceCardCarouselPropsBase,
  BalanceCardSkeletonPropsBase,
} from '@salmon/shared';

// Re-export shared types for convenience
export type { BlockchainId, BlockchainNetworkInfo, BlockchainBalance };

/**
 * Props for the BalanceCardCarousel component (React Native)
 */
export interface BalanceCardCarouselProps extends BalanceCardCarouselPropsBase<ViewStyle> {}

/**
 * Props for the BalanceCardSkeleton component (React Native)
 */
export interface BalanceCardSkeletonProps extends BalanceCardSkeletonPropsBase<ViewStyle> {}

/**
 * Props for the BalanceCard component (React Native)
 */
export interface BalanceCardProps extends BalanceCardPropsBase<ViewStyle> {
  /** Blockchain identifier for theming (optional, defaults to 'solana') */
  blockchain?: BlockchainId;
  /** Show network label (Devnet, Testnet, etc.) - typically enabled in developer mode */
  showNetworkLabel?: boolean;
}
