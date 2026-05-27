import type { ViewStyle } from 'react-native';
import type { IconBaseProps } from '@salmon/shared';

/**
 * Props for the Icon component (React Native)
 */
export interface IconProps extends IconBaseProps {
  /** Optional style for the icon container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}
