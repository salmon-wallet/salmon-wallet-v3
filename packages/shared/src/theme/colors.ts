/**
 * Color tokens for Salmon Wallet
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

export const colors = {
  background: {
    primary: '#10131c', // bg-darken
    secondary: '#161c2d',
    tertiary: 'rgba(255, 255, 255, 0.08)', // For elevated surfaces
    card: 'rgba(255, 255, 255, 0.05)',
    glass: 'rgba(0, 0, 0, 0.4)', // glass effect
    tokenItem: 'rgba(56, 63, 82, 0.1)', // Token list item background with blur
  },
  text: {
    primary: '#FFFFFF', // Unificado a blanco puro
    secondary: '#8A8D98', // Actualizado para mejor legibilidad
    tertiary: '#6B6E7B', // For less prominent text
    muted: 'rgba(255, 255, 255, 0.7)',
    placeholder: '#6B6E7B',
    disabled: 'rgba(255, 255, 255, 0.4)', // For disabled text elements
    token: '#d6d6d6', // For token names and USD values in TokenList
    tokenPrice: 'rgba(255, 255, 255, 0.79)', // For token prices
  },
  border: {
    default: '#404962',
    primary: '#404962', // Alias for default
    light: 'rgba(255, 255, 255, 0.8)',
    subtle: 'rgba(255, 255, 255, 0.15)', // For secondary button borders
  },
  accent: {
    primary: '#FF5C45', // orange/red - color de acento principal
    primaryEnd: 'rgba(161, 42, 42, 0.9)', // gradient end
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  /**
   * Price change colors for token lists and charts
   */
  change: {
    positive: '#80ff54',
    negative: '#FF5252',
    neutral: '#9E9E9E',
  },
  input: {
    background: 'rgba(64, 73, 98, 0.2)',
    border: '#404962',
    borderFocus: '#FF5C45', // Usa color de acento unificado
    borderError: '#EF4444',
    borderSuccess: '#10B981',
  },
  button: {
    primaryBackground: '#FFFFFF',
    primaryText: '#000000',
    secondaryBackground: '#2a3441',
    secondaryText: '#FFFFFF',
    disabledBackground: '#666666',
    disabledBackgroundEnd: '#444444',
    disabledText: '#666666',
    disabledOpacity: 0.5,
  },
  passwordStrength: {
    weak: '#EF4444',
    medium: '#F59E0B',
    strong: '#10B981',
  },
  step: {
    active: '#FF5C45',
    inactive: 'rgba(255, 255, 255, 0.3)',
  },
  skeleton: {
    base: 'rgba(64, 73, 98, 0.3)',
    highlight: 'rgba(64, 73, 98, 0.5)',
  },
  dialog: {
    overlay: 'rgba(0, 0, 0, 0.7)',
    background: '#1e2330',
    border: '#404962',
  },
  card: {
    background: 'rgba(64, 73, 98, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderActive: '#FF5C45',
  },
  /**
   * QR Scanner colors
   */
  scanner: {
    background: '#1a1a2e',
    surface: '#2a2a4e',
    text: '#ffffff',
    textSecondary: '#8b8b9e',
    textTertiary: '#6b6b7e',
    button: '#4a4a6e',
  },
  /**
   * Color palette for feature badges, avatars, and decorative elements
   */
  palette: {
    orange: '#FF5C45',
    green: '#10B981',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    blue: '#3B82F6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    indigo: '#6366F1',
  },
  /**
   * Verification badge colors
   */
  verified: {
    background: 'rgba(76, 175, 80, 0.2)',
    icon: '#4CAF50',
  },
  /**
   * Blockchain-specific colors
   */
  blockchain: {
    solana: {
      primary: '#9945FF',      // Solana purple
      secondary: '#14F195',    // Solana green accent
      gradient: ['#4A1A8C', '#2D1052', '#1A0A33'] as const,
    },
    bitcoin: {
      primary: '#F7931A',      // Bitcoin orange
      secondary: '#FFB84D',    // Lighter orange accent
      gradient: ['#F7931A', '#8B5A00', '#3D2800'] as const,
    },
    ethereum: {
      primary: '#627EEA',      // Ethereum blue
      secondary: '#C0C8F9',    // Light blue accent
      gradient: ['#627EEA', '#3A4A8C', '#1A1F33'] as const,
    },
  },
} as const;

/**
 * Gradient definitions
 * - Use `colors` array with `start`/`end` for React Native LinearGradient
 * - Use CSS string for web
 */
export const gradients = {
  primary: {
    colors: ['#FF5C45', 'rgba(161, 42, 42, 0.9)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  /**
   * Primary action button gradient (e.g., Send button)
   */
  primaryButton: {
    colors: ['#FF5C45', 'rgba(161, 42, 42, 0.9)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.04 }, // ~93.8 degrees
  },
  /**
   * Balance card cosmic/purple gradient
   */
  balanceCard: {
    colors: ['#4A1A8C', '#2D1052', '#1A0A33'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /**
   * Balance card Solana gradient
   */
  balanceCardSolana: {
    colors: ['#4A1A8C', '#2D1052', '#1A0A33'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Balance card Bitcoin gradient
   */
  balanceCardBitcoin: {
    colors: ['#F7931A', '#8B5A00', '#3D2800'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Balance card Ethereum gradient
   */
  balanceCardEthereum: {
    colors: ['#627EEA', '#3A4A8C', '#1A1F33'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Disabled button gradient
   */
  disabled: {
    colors: ['#666666', '#444444'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  /**
   * Onboarding/Auth screens dark gradient background
   */
  onboarding: {
    colors: ['#10131c', '#161c2d'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  // CSS versions for web
  primaryCSS:
    'linear-gradient(101deg, rgb(255, 92, 69) 12%, rgba(161, 42, 42, 0.9) 83%)',
  primaryButtonCSS:
    'linear-gradient(90deg, #ff5c45 0%, #ff3d2e 100%)',
  balanceCardCSS:
    'linear-gradient(135deg, #4A1A8C 0%, #2D1052 50%, #1A0A33 100%)',
  disabledCSS:
    'linear-gradient(90deg, #666666 0%, #444444 100%)',
} as const;

export type Colors = typeof colors;
export type Gradients = typeof gradients;
