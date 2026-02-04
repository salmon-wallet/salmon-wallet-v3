import type { StyleProp, ViewStyle } from 'react-native';

export type BlurTint = 'light' | 'dark' | 'default';

export interface BlurContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Blur intensity for BlurView
   * @default 40
   */
  blurIntensity?: number;
  /**
   * Blur tint for BlurView
   * @default 'dark'
   */
  blurTint?: BlurTint;
  /**
   * Background color for the container
   * @default colors.background.tokenItem (#383F52 at 10% opacity)
   */
  backgroundColor?: string;
  /**
   * Border color for the container
   * @default colors.border.default (#404962)
   */
  borderColor?: string;
  /**
   * Border width for the container
   * @default 1
   */
  borderWidth?: number;
}
