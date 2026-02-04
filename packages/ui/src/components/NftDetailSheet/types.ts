import type { ViewStyle } from 'react-native';

/**
 * NFT attribute with trait type and value
 */
export interface NftAttribute {
  /** The trait type/category */
  trait_type: string;
  /** The attribute value */
  value: string;
}

/**
 * Extended NFT data structure for the detail sheet
 * Includes additional fields like description and attributes
 */
export interface NftDetailData {
  /** The NFT mint address */
  mint: string;
  /** NFT name */
  name: string;
  /** NFT image URL */
  image?: string;
  /** NFT description */
  description?: string;
  /** Collection name the NFT belongs to */
  collectionName?: string;
  /** Array of NFT attributes/traits */
  attributes?: NftAttribute[];
}

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
