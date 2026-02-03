/**
 * Shadow definitions for Salmon Wallet
 * Provides both React Native and CSS shadow formats
 */

/**
 * React Native shadow properties
 * Used with View style shadowColor, shadowOffset, shadowOpacity, shadowRadius
 */
export const shadows = {
  /** No shadow */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Subtle shadow for cards */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  /** Default shadow */
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  /** Elevated shadow for modals, dropdowns */
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  /** Heavy shadow for prominent elements */
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  /** Maximum shadow for overlays */
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  /** Strong shadow for header/card elements - Figma: 0px 10px 20px rgba(0,0,0,0.9) */
  header: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
  },
  /** Colored glow for accent elements */
  glow: {
    shadowColor: '#ff5c45',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * CSS box-shadow values for web
 * Use directly in style or className
 */
export const shadowsCSS = {
  /** No shadow */
  none: 'none',
  /** Subtle shadow for cards */
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.18)',
  /** Default shadow */
  md: '0 2px 4px -1px rgba(0, 0, 0, 0.23), 0 4px 5px 0 rgba(0, 0, 0, 0.14)',
  /** Elevated shadow for modals, dropdowns */
  lg: '0 4px 8px -2px rgba(0, 0, 0, 0.3), 0 8px 16px -4px rgba(0, 0, 0, 0.2)',
  /** Heavy shadow for prominent elements */
  xl: '0 8px 16px -4px rgba(0, 0, 0, 0.37), 0 16px 32px -8px rgba(0, 0, 0, 0.25)',
  /** Maximum shadow for overlays */
  '2xl':
    '0 12px 24px -6px rgba(0, 0, 0, 0.44), 0 24px 48px -12px rgba(0, 0, 0, 0.3)',
  /** Strong shadow for header/card elements - Figma: 0px 10px 20px rgba(0,0,0,0.9) */
  header: '0 10px 20px rgba(0, 0, 0, 0.9)',
  /** Colored glow for accent elements */
  glow: '0 0 24px rgba(255, 92, 69, 0.5)',
} as const;

export type Shadows = typeof shadows;
export type ShadowsCSS = typeof shadowsCSS;
