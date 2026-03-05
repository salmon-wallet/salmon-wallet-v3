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
  /** 4px - Gap between amounts in token list item */
  tokenAmountGap: 4,
  /** 8px */
  sm: 8,
  /** 10px - Used for header icon gaps */
  base: 10,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 18px - Header horizontal padding */
  headerPadding: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 30px - Shadow overflow hack */
  '3.5xl': 30,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 42px - Pagination gap in balance card */
  paginationGap: 42,
  /** 48px */
  '5xl': 48,
  /** 60px */
  '5.5xl': 60,
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
  /** 2px - Scrollbar thumb corners */
  scrollbar: 2,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 14px - Medium button corners */
  button: 14,
  /** 16px */
  xl: 16,
  /** 18px - Icon container corners */
  iconContainer: 18,
  /** 20px - Large icon/avatar corners */
  iconLg: 20,
  /** 22px - Token icon rounded corners */
  tokenIcon: 22,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 24px - Header rounded corners */
  header: 24,
  /** 26px - Balance card rounded corners */
  card: 26,
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
  buttonHeightMedium: 48,
  buttonHeightSmall: 44,
  /** 42px - Compact action buttons (swap, bridge, receive, success) */
  buttonHeightCompact: 42,
  buttonRadius: 28,        // Para botones redondeados
  buttonRadiusSmall: 21,

  // ActionButtonRow
  /** Action button width: 112px */
  actionButtonWidth: 112,
  /** Action button height: 47px */
  actionButtonHeight: 47,
  /** Action button border radius: 14px */
  actionButtonRadius: 14,
  /** Action button icon size: 16px */
  actionButtonIcon: 16,

  // Inputs
  inputHeight: 56,
  /** 58px - Swap amount input height */
  inputHeightLg: 58,
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

  // Icon scale
  /** 16px */
  iconSizeXs: 16,
  /** 18px - Type badges, source badge chips */
  iconSizeXSmall: 18,
  /** 20px */
  iconSizeSmall: 20,
  /** 22px - Compact token icons (swap selector) */
  iconSizeCompact: 22,
  /** 24px */
  iconSizeMedium: 24,
  /** 28px - Small copy/action icon buttons */
  iconSizeMButton: 28,
  /** 32px */
  iconSizeLarge: 32,
  /** 36px - Token card logos, address book rows */
  iconSizeXL: 36,
  /** 40px - Avatars, type icon containers */
  iconSize2XL: 40,
  /** 48px - Featured tokens, add account icons */
  iconSize3XL: 48,
  /** 52px - NFT action buttons height */
  iconSize4XL: 52,
  /** 54px - Swap logo container width */
  iconSize5XL: 54,
  /** 56px - Large component icons (same as buttonHeight) */
  iconSize6XL: 56,
  /** 100px - Large token icons (confirmation step) */
  tokenIconXL: 100,

  // Header
  headerHeight: 56,
  /** 44px - Header action buttons */
  headerButtonSize: 44,
  backButtonSize: 40,

  // Balance card elements
  /** Logo container size: 35px */
  logoContainer: 35,
  /** Blockchain icon size: 45px */
  blockchainIcon: 45,
  /** Eye icon size: 20px */
  eyeIcon: 20,
  /** Change arrow icon size: 15px */
  changeArrowIcon: 15,

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

  // TokenListItem (from Figma)
  /** Token icon size: 38px */
  tokenIcon: 38,

  // Sheet/Modal components
  /** Sheet drag handle width: 70px */
  sheetHandleWidth: 70,
  /** Sheet drag handle height: 6px */
  sheetHandleHeight: 6,
  /** Sheet drag handle opacity - uses opacity.faint */
  sheetHandleOpacity: 0.4 as const,
  /** Sheet top fade gradient height: 30px */
  sheetFadeGradientHeight: 30,

  // ReceiveSheet
  /** QR code white border width: 22px */
  qrBorderWidth: 22,
  /** Vertical gap between ReceiveSheet content elements: 32px */
  receiveContentGap: 32,
  /** Copy button width: 180px */
  copyButtonWidth: 180,

  // Scrollbar widths
  /** 4px - Thin scrollbar */
  scrollbarWidthSm: 4,
  /** 6px - Standard scrollbar */
  scrollbarWidth: 6,

  // Dividers
  /** 1px - Divider/separator height */
  dividerHeight: 1,

  // Background decorative
  /** 200px - Background gradient/pattern height */
  backgroundPatternHeight: 200,

  // Skeleton badge
  /** 100px - Skeleton badge width */
  skeletonBadgeWidth: 100,

  // Skeleton placeholders
  /** 70px - Skeleton balance placeholder width */
  skeletonBalanceWidth: 70,

  // Button min-widths
  /** 120px - Default button minimum width */
  buttonMinWidth: 120,
  /** 160px - Large button minimum width */
  buttonMinWidthLg: 160,

  // Swap
  /** 100px - Swap token selector minimum width */
  swapSelectorMinWidth: 100,
  /** 75px - Swap review card minimum height */
  swapReviewCardMinHeight: 75,

  // Badge
  /** 55px - Badge item minimum width */
  badgeMinWidth: 55,

  // Token icon small (web)
  /** 33px - Small token icon (web list items) */
  tokenIconSm: 33,

  // Chart
  /** 200px - Price chart default height */
  chartHeight: 200,

  // Web layout
  /** 430px - Web extension container max width */
  webContainerMaxWidth: 430,

  // NFT
  /** 406px - NFT image max width */
  nftImageMaxWidth: 406,

  // Sheet
  /** 700px - Sheet dialog max height */
  sheetMaxHeight: 700,
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
  /** 0.5px - Action button border */
  actionButton: 0.5,
  /** 0.75px - TokenListItem container border */
  tokenListItem: 0.75,
  /** 1px */
  thin: 1,
  /** 1.38px - Figma header border (1.38px rgba(255,255,255,0.8)) */
  header: 1.38,
  /** 2px */
  medium: 2,
  /** 0.75px - Sheet top border */
  sheet: 0.75,
} as const;

/**
 * Opacity tokens for consistent transparency values
 */
export const opacity = {
  /** 0 - Fully transparent (animations) */
  none: 0,
  /** 0.4 - Placeholder / very muted */
  faint: 0.4,
  /** 0.5 - Disabled / inactive */
  disabled: 0.5,
  /** 0.6 - Low emphasis text */
  low: 0.6,
  /** 0.8 - Medium emphasis / active press */
  medium: 0.8,
  /** 0.85 - Hover / secondary content */
  high: 0.85,
  /** 0.9 - Subtle mute / soft emphasis */
  soft: 0.9,
  /** 1 - Fully opaque */
  full: 1,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type ComponentSizes = typeof componentSizes;
export type ContentPadding = typeof contentPadding;
export type BorderWidth = typeof borderWidth;
export type Opacity = typeof opacity;
