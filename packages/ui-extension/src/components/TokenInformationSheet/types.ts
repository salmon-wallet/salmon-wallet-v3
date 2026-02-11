import type { CSSProperties } from 'react';
import type { TokenInformationSheetPropsBase, TokenBadgesSectionPropsBase } from '@salmon/shared';
import type { MarketData } from '../TokenMarketData';

// Re-export CoinInfo for consumers
export type { CoinInfo } from '@salmon/shared';

/**
 * Props for the TokenInformationSheet component (Web/Extension)
 */
export interface TokenInformationSheetProps
  extends Omit<TokenInformationSheetPropsBase<CSSProperties>, 'marketData'> {
  /** Market data (market cap, volume, etc.) */
  marketData: MarketData | undefined;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for the TokenBadgesSection component (Web/Extension)
 */
export interface TokenBadgesSectionProps extends TokenBadgesSectionPropsBase<CSSProperties> {
  /** Optional CSS class name */
  className?: string;
}
