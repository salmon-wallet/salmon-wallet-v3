import type { TokenFeature } from '../ui';

/**
 * Props for the TokenFeatures component (base - platform-agnostic)
 * Displays a horizontal scrollable row of feature badges/chips
 */
export interface TokenFeaturesPropsBase<TStyle = any> {
  /** Array of token features to display */
  features: TokenFeature[];
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: TStyle;
}
