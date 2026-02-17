import type { CSSProperties } from 'react';
import type { NftData, NftAttribute } from '../NftCard/types';

// Re-export for convenience
export type { NftAttribute, NftData } from '../NftCard/types';

/**
 * NFT detail data is the full NftData type (same as ui)
 */
export type NftDetailData = NftData;

/**
 * Props for the NftDetailPage component (Web/Extension)
 * Full-page view for displaying NFT details in browser extension
 */
export interface NftDetailPageProps {
  /** NFT data to display */
  nft: NftDetailData;
  /** Callback to navigate back */
  onBack: () => void;
  /** Callback when Send button is pressed */
  onSendPress?: () => void;
  /** Callback when Burn button is pressed */
  onBurnPress?: () => void;
  /** Optional custom styles */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
