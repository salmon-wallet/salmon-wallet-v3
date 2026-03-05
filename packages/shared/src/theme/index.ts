/**
 * Salmon Wallet Design Tokens
 *
 * Shared design system for both:
 * - Expo (React Native) mobile app
 * - WXT+Vite browser extension
 *
 * Usage:
 * ```ts
 * import { colors, spacing, typography } from '@salmon/shared';
 * ```
 */

import { colors, gradients } from './colors';
import {
  spacing,
  borderRadius,
  borderWidth,
  componentSizes,
  contentPadding,
  opacity,
} from './spacing';
import {
  fontFamily,
  fontFamilyNative,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} from './typography';
import { shadows, shadowsCSS } from './shadows';
import { duration, durationMs, easing } from './durations';

// Re-export all tokens from colors
export { colors, gradients, getScalesColorForBlockchain } from './colors';
export type { Colors, Gradients } from './colors';

// Re-export all tokens from spacing
export {
  spacing,
  borderRadius,
  borderWidth,
  componentSizes,
  contentPadding,
  opacity,
} from './spacing';
export type {
  Spacing,
  BorderRadius,
  BorderWidth,
  ComponentSizes,
  ContentPadding,
  Opacity,
} from './spacing';

// Re-export all tokens from typography
export {
  fontFamily,
  fontFamilyNative,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} from './typography';
export type {
  FontFamily,
  FontFamilyNative,
  FontSize,
  LineHeight,
  FontWeight,
  LetterSpacing,
  TextStyles,
} from './typography';

// Re-export all tokens from shadows
export { shadows, shadowsCSS } from './shadows';
export type { Shadows, ShadowsCSS } from './shadows';

// Re-export all tokens from durations
export { duration, durationMs, easing } from './durations';
export type { Duration, DurationMs, Easing } from './durations';

/**
 * Complete theme object combining all tokens
 * Useful for theme providers
 */
export const theme = {
  colors,
  gradients,
  spacing,
  borderRadius,
  borderWidth,
  componentSizes,
  contentPadding,
  fontFamily,
  fontFamilyNative,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  opacity,
  shadows,
  shadowsCSS,
  duration,
  durationMs,
  easing,
} as const;

export type Theme = typeof theme;
