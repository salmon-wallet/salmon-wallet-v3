import type { ViewStyle } from 'react-native';
import type { NftData, NftAttribute } from '../NftCard/types';

// Re-export for convenience
export type { NftAttribute, NftData } from '../NftCard/types';

/**
 * NFT detail data is the full NftData type
 * The detail sheet can display all blockchain-specific fields
 */
export type NftDetailData = NftData;

/**
 * Props for the NftDetailSheet component
 * Bottom sheet modal for displaying NFT details
 */
export interface NftDetailSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet is closed */
  onClose: () => void;
  /** NFT data to display */
  nft: NftDetailData | null;
  /** Callback when Send button is pressed */
  onSendPress?: () => void;
  /** Callback when Burn button is pressed */
  onBurnPress?: () => void;
  /** Optional custom styles for the container */
  style?: ViewStyle;
}
