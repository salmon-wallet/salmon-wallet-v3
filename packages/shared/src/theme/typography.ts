/**
 * Typography tokens for Salmon Wallet
 * Uses DM Sans as the primary font family
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

export const fontFamily = {
  /** Primary font - DM Sans */
  sans: 'DM Sans',
  /** Monospace font for addresses, codes, etc. */
  mono: 'DM Mono',
} as const;

/**
 * React Native font family names
 * These are the actual font family names loaded in Expo
 * Used in React Native mobile app for fontFamily style property
 */
export const fontFamilyNative = {
  /** DM Sans Light (300) */
  light: 'DMSansLight',
  /** DM Sans Regular (400) */
  regular: 'DMSansRegular',
  /** DM Sans Medium (500) */
  medium: 'DMSansMedium',
  /** DM Sans SemiBold (600) */
  semiBold: 'DMSansSemiBold',
  /** DM Sans Bold (700) */
  bold: 'DMSansBold',
  /** DM Sans ExtraBold (800) */
  extraBold: 'DMSansExtraBold',
  /** DM Sans Black (900) */
  black: 'DMSansBlack',
} as const;

/**
 * Font sizes in pixels
 * Use with lineHeight for proper text rendering
 */
export const fontSize = {
  /** 10px - Extra small, fine print */
  xs: 10,
  /** 11.375px - TokenListItem change text */
  tokenChange: 11.375,
  /** 12px - Small, captions */
  sm: 12,
  /** 13.65px - TokenListItem name and price */
  tokenNamePrice: 13.65,
  /** 14px - Base size */
  base: 14,
  /** 14.5px - Action button text */
  actionButton: 14.5,
  /** 16px - Medium */
  md: 16,
  /** 18px - Large */
  lg: 18,
  /** 20px - Extra large */
  xl: 20,
  /** 24px - 2XL, subheadings */
  '2xl': 24,
  /** 30px - 3XL, headings */
  '3xl': 30,
  /** 36px - 4XL, large headings */
  '4xl': 36,
  /** 48px - 5XL, hero text */
  '5xl': 48,
  /** 60px - Balance card amount */
  balance: 60,
} as const;

/**
 * Line heights (multipliers)
 * Multiply by font size to get actual line height
 */
export const lineHeight = {
  /** Tight - 1.0 */
  none: 1,
  /** Tight - 1.25 */
  tight: 1.25,
  /** Snug - 1.375 */
  snug: 1.375,
  /** TokenListItem - 1.4 */
  tokenListItem: 1.4,
  /** Normal - 1.5 */
  normal: 1.5,
  /** Relaxed - 1.625 */
  relaxed: 1.625,
  /** Loose - 2 */
  loose: 2,
} as const;

/**
 * Font weights
 * Maps to DM Sans weight variants
 */
export const fontWeight = {
  /** 300 - Light */
  light: '300',
  /** 400 - Regular */
  regular: '400',
  /** 500 - Medium */
  medium: '500',
  /** 600 - Semibold */
  semibold: '600',
  /** 700 - Bold */
  bold: '700',
} as const;

/**
 * Letter spacing in pixels
 */
export const letterSpacing = {
  /** Tighter - -0.5px */
  tighter: -0.5,
  /** Tight - -0.25px */
  tight: -0.25,
  /** Normal - 0px */
  normal: 0,
  /** Header text - 0.12px */
  header: 0.12,
  /** Wide - 0.25px */
  wide: 0.25,
  /** Change text - 0.13px */
  change: 0.13,
  /** Balance amount - -0.245px */
  balance: -0.245,
  /** Wider - 0.5px */
  wider: 0.5,
  /** Widest - 1px */
  widest: 1,
} as const;

/**
 * Pre-composed text styles for common use cases
 */
export const textStyles = {
  /** Hero/display text */
  display: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  /** Page headings */
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  /** Section headings */
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  /** Subsection headings */
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  /** Card headings */
  h4: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  /** Body text - large */
  bodyLarge: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Body text - default */
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Body text - small */
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Labels and captions */
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  /** Button text */
  button: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wide,
  },
  /** Monospace text (addresses, codes) */
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type FontFamily = typeof fontFamily;
export type FontFamilyNative = typeof fontFamilyNative;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
export type FontWeight = typeof fontWeight;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
