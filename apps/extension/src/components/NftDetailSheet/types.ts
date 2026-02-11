import type { CSSProperties } from 'react';
import type { NftData, NftAttribute } from '../NftCard/types';

// Re-export for convenience
export type { NftAttribute, NftData } from '../NftCard/types';

/**
 * NFT detail data is the full NftData type (same as ui)
 */
export type NftDetailData = NftData;

/**
 * Props for the NftDetailSheet component (Web/Extension)
 * Dialog for displaying NFT details in browser extension
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
  /** Optional custom styles for the dialog paper */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
