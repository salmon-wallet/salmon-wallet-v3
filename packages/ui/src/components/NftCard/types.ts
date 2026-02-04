import type { StyleProp, ViewStyle } from 'react-native';

/**
 * NFT data structure for display
 */
export interface NftData {
  /** Unique mint address of the NFT */
  mint: string;
  /** Display name of the NFT */
  name: string;
  /** Optional image URL for the NFT */
  image?: string;
  /** Optional collection name */
  collectionName?: string;
}

/**
 * Props for the NftCard component
 */
export interface NftCardProps {
  /** NFT data to display */
  nft: NftData;
  /** Callback when the card is pressed */
  onPress?: () => void;
  /** Optional custom styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the NftCardSkeleton component
 */
export interface NftCardSkeletonProps {
  /** Optional custom styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
  /** Whether to animate the skeleton (default: true) */
  animated?: boolean;
}
