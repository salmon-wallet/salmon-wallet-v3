import type { CSSProperties } from 'react';
import type { NftData, NftBlockchain } from '@salmon/shared';

export interface NftCarouselSectionProps {
  title: string;
  blockchain: NftBlockchain;
  nfts: NftData[];
  loading?: boolean;
  onNftPress?: (nft: NftData) => void;
  onSeeAllPress?: () => void;
  style?: CSSProperties;
  className?: string;
}

export interface NftCarouselSectionSkeletonProps {
  count?: number;
  style?: CSSProperties;
  className?: string;
}
