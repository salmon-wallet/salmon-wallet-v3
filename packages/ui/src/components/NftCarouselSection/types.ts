import type { StyleProp, ViewStyle } from 'react-native';
import type { NftData, NftBlockchain } from '../NftCard';

// Re-export for convenience
export type { NftBlockchain };

/**
 * Props for the NftCarouselSection component
 */
export interface NftCarouselSectionProps {
  /** Section title (e.g., "Solana", "Ethereum") */
  title: string;
  /** Blockchain type for icon display */
  blockchain: NftBlockchain;
  /** Array of NFTs to display */
  nfts: NftData[];
  /** Loading state */
  loading?: boolean;
  /** Callback when an NFT is pressed */
  onNftPress?: (nft: NftData) => void;
  /** Callback when "See All" is pressed */
  onSeeAllPress?: () => void;
  /** Optional custom styles */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the NftCarouselSectionSkeleton component
 */
export interface NftCarouselSectionSkeletonProps {
  /** Section title for header skeleton */
  title?: string;
  /** Blockchain type for icon display */
  blockchain?: NftBlockchain;
  /** Number of skeleton cards to show (default: 4) */
  count?: number;
  /** Optional custom styles */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}
