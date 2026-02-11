import type { StyleProp, ViewStyle } from 'react-native';
import type { BlurContainerPropsBase } from '@salmon/shared';

// Re-export BlurTint for consumers
export type { BlurTint } from '@salmon/shared';

/**
 * Props for the BlurContainer component (React Native)
 */
export interface BlurContainerProps extends BlurContainerPropsBase<StyleProp<ViewStyle>> {}
