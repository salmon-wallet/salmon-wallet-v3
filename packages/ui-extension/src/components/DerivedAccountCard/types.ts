import type { CSSProperties } from 'react';

export interface DerivedAccountCardProps {
  address: string;
  networkName: string;
  path: string;
  balanceFormatted: string;
  selected: boolean;
  dimmed: boolean;
  onToggle: () => void;
  blockchain?: 'solana' | 'bitcoin' | 'ethereum';
  style?: CSSProperties;
  className?: string;
}

export interface DerivedAccountCardSkeletonProps {
  style?: CSSProperties;
  className?: string;
}
