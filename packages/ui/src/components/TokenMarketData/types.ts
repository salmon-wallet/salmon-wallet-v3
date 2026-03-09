import type { CSSProperties } from 'react';
import type { MarketData, TokenMarketDataPropsBase } from '@salmon/shared';

// Re-export shared types for convenience
export type { MarketData };

/**
 * Props for the TokenMarketData component (Web/Extension)
 */
export interface TokenMarketDataProps extends TokenMarketDataPropsBase<CSSProperties> {
  /** Optional className for the container */
  className?: string;
}
