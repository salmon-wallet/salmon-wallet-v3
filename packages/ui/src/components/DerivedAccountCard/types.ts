import type { CSSProperties } from 'react';
import type { Testable } from '@salmon/shared';

export interface DerivedAccountCardProps extends Testable {
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
