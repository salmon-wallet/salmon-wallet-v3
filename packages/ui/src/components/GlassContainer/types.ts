import type { StyleProp, ViewStyle } from 'react-native';

export type GlassEffectStyle = 'clear' | 'regular';
export type BlurTint = 'light' | 'dark' | 'default';

export interface GlassContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Glass effect style for iOS 26+ Liquid Glass
   * - 'clear': More transparent, crystal-like effect
   * - 'regular': More opaque, material effect
   * @default 'clear'
   */
  glassStyle?: GlassEffectStyle;
  /**
   * Tint color overlay for iOS 26+ Liquid Glass
   * Applies a color tint on top of the glass effect
   * Accepts any valid React Native color (hex, rgb, color names)
   */
  tintColor?: string;
  /**
   * Blur intensity for fallback BlurView (iOS < 26 / Android)
   * @default 20
   */
  fallbackBlurIntensity?: number;
  /**
   * Blur tint for fallback BlurView
   * @default 'dark'
   */
  fallbackBlurTint?: BlurTint;
  /**
   * Background color for fallback container
   * @default 'rgba(30, 30, 30, 0.5)'
   */
  fallbackBackgroundColor?: string;
  /**
   * Border color for fallback container
   * @default 'rgba(255, 255, 255, 0.1)'
   */
  fallbackBorderColor?: string;
  /**
   * Border width for fallback container
   * @default 1
   */
  fallbackBorderWidth?: number;
}
