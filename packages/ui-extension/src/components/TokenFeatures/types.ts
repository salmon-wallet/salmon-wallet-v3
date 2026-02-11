import type { CSSProperties } from 'react';
import type { TokenFeaturesPropsBase } from '@salmon/shared';

// Re-export TokenFeature for consumers
export type { TokenFeature } from '@salmon/shared';

/**
 * Props for the TokenFeatures component (Web/Extension)
 */
export interface TokenFeaturesProps extends TokenFeaturesPropsBase<CSSProperties> {
  /** Optional className for the container */
  className?: string;
}
