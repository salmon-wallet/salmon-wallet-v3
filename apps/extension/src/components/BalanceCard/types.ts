/**
 * BalanceCard types for @salmon/ui-extension
 */
import type { CSSProperties } from 'react';
import type { BalanceCardPropsBase, BalanceCardCarouselPropsBase, BlockchainId } from '@salmon/shared';

/**
 * Props for the BalanceCard component (Web/Extension)
 */
export interface BalanceCardProps extends BalanceCardPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
  /** Blockchain identifier for theming */
  blockchain?: BlockchainId;
  /** Show network label (Devnet, Testnet, etc.) */
  showNetworkLabel?: boolean;
}

/**
 * Props for the BalanceCardCarousel component (Web/Extension)
 */
export interface BalanceCardCarouselProps extends BalanceCardCarouselPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
}
