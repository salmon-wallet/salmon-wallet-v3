import type { ViewStyle } from 'react-native';
import type { TokenFeaturesPropsBase } from '@salmon/shared';

// Re-export TokenFeature for consumers
export type { TokenFeature } from '@salmon/shared';

/**
 * Props for the TokenFeatures component (React Native)
 */
export interface TokenFeaturesProps extends TokenFeaturesPropsBase<ViewStyle> {}
