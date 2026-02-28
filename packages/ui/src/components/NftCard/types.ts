import type { CSSProperties } from 'react';

// Import NFT types from shared package (same as ui does)
export type {
  NftBlockchain,
  NftAttribute,
  NftDataBase,
  NftData,
  NftDataSimple,
  SolanaNftData,
  EthereumNftData,
  BitcoinNftData,
} from '@salmon/shared';

// Re-import for local use
import type { NftData } from '@salmon/shared';

/**
 * Props for the NftCard component (Web/Extension)
 */
export interface NftCardProps {
  /** NFT data to display */
  nft: NftData;
  /** Callback when the card is pressed */
  onPress?: () => void;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the NftCardSkeleton component (Web/Extension)
 */
export interface NftCardSkeletonProps {
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  testID?: string;
  /** Whether to animate the skeleton (default: true) */
  animated?: boolean;
}
