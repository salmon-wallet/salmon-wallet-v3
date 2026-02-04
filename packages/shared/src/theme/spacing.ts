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
  /** 10px - Used for header icon gaps */
  base: 10,
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
  /** 32px */
  '3xl': 32,
  /** 34.557px - Figma header rounded corners */
  header: 35,
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

  // Header + Card overlap (from Figma)
  /** Inner header container height: 63px */
  headerInnerHeight: 63,
  /** Card top padding to push content below header: ~114px in Figma */
  cardHeaderOffset: 114,

  // Tab Bar (GlassTabBar)
  /** Tab bar gradient padding top: 32px */
  tabBarPaddingTop: 32,
  /** Tab bar content height (icon + padding): 56px */
  tabBarContentHeight: 56,
  /** Tab bar minimum bottom padding (fallback when no safe area): 16px */
  tabBarMinBottomPadding: 16,
  /** Tab bar total base height (without safe area): 88px */
  tabBarHeight: 88,
  /** Scroll content bottom padding to clear tab bar */
  tabBarScrollPadding: 160,
} as const;

/**
 * Content padding values for screens and containers
 */
export const contentPadding = {
  screen: 24,
  card: 16,
  modal: 20,
} as const;

/**
 * Border width tokens
 */
export const borderWidth = {
  /** 0px */
  none: 0,
  /** 1px */
  thin: 1,
  /** 1.38px - Figma header border (1.38px rgba(255,255,255,0.8)) */
  header: 1.38,
  /** 2px */
  medium: 2,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type ComponentSizes = typeof componentSizes;
export type ContentPadding = typeof contentPadding;
export type BorderWidth = typeof borderWidth;
