import type { StyleProp, ViewStyle } from 'react-native';
import type { NftData } from '../NftCard';
import type { NftBlockchain } from '../NftCarouselSection';

/**
 * Props for the NftSeeAllSheet component
 */
export interface NftSeeAllSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet is closed */
  onClose: () => void;
  /** Sheet title (e.g., "Solana NFTs") */
  title: string;
  /** Blockchain type for icon display */
  blockchain: NftBlockchain;
  /** Array of NFTs to display in grid */
  nfts: NftData[];
  /** Loading state */
  loading?: boolean;
  /** Callback when an NFT is pressed */
  onNftPress?: (nft: NftData) => void;
  /** Optional custom styles for the sheet container */
  style?: StyleProp<ViewStyle>;
}
