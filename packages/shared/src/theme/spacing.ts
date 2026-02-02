/**
 * Spacing scale for Salmon Wallet
 * Based on 4px base unit for consistent spacing
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

export const spacing = {
  /** 0px */
  none: 0,
  /** 2px */
  '2xs': 2,
  /** 2px - alias for 2xs */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
  /** 64px */
  '6xl': 64,
  /** 80px */
  '7xl': 80,
  /** 96px */
  '8xl': 96,
} as const;

/**
 * Border radius tokens
 */
export const borderRadius = {
  /** 0px */
  none: 0,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 24px */
  '2xl': 24,
  /** 9999px - fully rounded */
  full: 9999,
} as const;

/**
 * Component sizes for consistent UI elements
 * Used primarily in onboarding and common components
 */
export const componentSizes = {
  // Buttons
  buttonHeight: 56,
  buttonHeightSmall: 44,
  buttonRadius: 28,        // Para botones redondeados
  buttonRadiusSmall: 21,

  // Inputs
  inputHeight: 56,
  inputRadius: 12,

  // Logo
  logoSizeLarge: 137,
  logoSizeMedium: 120,
  logoSizeSmall: 80,

  // Step indicator
  stepDotSize: 8,
  stepDotGap: 8,

  // Checkbox
  checkboxSize: 24,

  // Icons
  iconSizeSmall: 20,
  iconSizeMedium: 24,
  iconSizeLarge: 32,

  // Header
  headerHeight: 56,
  backButtonSize: 40,
} as const;

/**
 * Content padding values for screens and containers
 */
export const contentPadding = {
  screen: 24,
  card: 16,
  modal: 20,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type ComponentSizes = typeof componentSizes;
export type ContentPadding = typeof contentPadding;
