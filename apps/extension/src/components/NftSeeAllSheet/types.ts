import type { CSSProperties } from 'react';
import type { NftData, NftBlockchain } from '@salmon/shared';

export interface NftSeeAllSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  blockchain: NftBlockchain;
  nfts: NftData[];
  loading?: boolean;
  onNftPress?: (nft: NftData) => void;
  style?: CSSProperties;
  className?: string;
}
