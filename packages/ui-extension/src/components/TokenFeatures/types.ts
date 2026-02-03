import type { CSSProperties } from 'react';
import type { TokenFeature } from '@salmon/shared';

/**
 * Props for the TokenFeatures component
 * Displays a horizontal scrollable row of feature badges/chips
 */
export interface TokenFeaturesProps {
  /** Array of token features to display */
  features: TokenFeature[];
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional className for the container */
  className?: string;
}
