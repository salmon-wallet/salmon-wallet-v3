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
} from './spacing';
import {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} from './typography';
import { shadows, shadowsCSS } from './shadows';

// Re-export all tokens from colors
export { colors, gradients } from './colors';
export type { Colors, Gradients } from './colors';

// Re-export all tokens from spacing
export {
  spacing,
  borderRadius,
  borderWidth,
  componentSizes,
  contentPadding,
} from './spacing';
export type {
  Spacing,
  BorderRadius,
  BorderWidth,
  ComponentSizes,
  ContentPadding,
} from './spacing';

// Re-export all tokens from typography
export {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  textStyles,
} from './typography';
export type {
  FontFamily,
  FontSize,
  LineHeight,
  FontWeight,
  LetterSpacing,
  TextStyles,
} from './typography';

// Re-export all tokens from shadows
export { shadows, shadowsCSS } from './shadows';
export type { Shadows, ShadowsCSS } from './shadows';

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
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  shadows,
  shadowsCSS,
} as const;

export type Theme = typeof theme;
