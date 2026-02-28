import type { CSSProperties } from 'react';
import type { NftData, NftBlockchain } from '@salmon/shared';

export interface NftSeeAllPageProps {
  /** Section title (e.g. "Solana NFTs (12)") */
  title: string;
  /** Blockchain for theming */
  blockchain: NftBlockchain;
  /** NFTs to display in the grid */
  nfts: NftData[];
  /** Callback when an NFT card is pressed */
  onNftPress?: (nft: NftData) => void;
  /** Callback to navigate back */
  onBack: () => void;
  /** Optional custom styles */
  style?: CSSProperties;
  /** Optional CSS class name */
  className?: string;
}
