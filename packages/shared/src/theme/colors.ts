/**
 * Color tokens for Salmon Wallet
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

import type { BlockchainId } from '../types/ui/balance-card';

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
    balance: '#e0e0e0', // Balance card amount color
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
    border: 'rgba(255, 92, 69, 0.8)', // accent-colored borders
    tint: 'rgba(255, 92, 69, 0.1)', // subtle accent background
    tintHover: 'rgba(255, 92, 69, 0.15)', // accent hover background
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    successBackground: 'rgba(76, 175, 80, 0.1)',
    errorBackground: 'rgba(239, 68, 68, 0.1)',
    warningBackground: 'rgba(255, 171, 0, 0.1)',
    warningBorder: 'rgba(255, 171, 0, 0.3)',
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
    cancelBackground: '#1f232f',
    dangerHover: '#FF7A64',
    destructiveHover: '#DC2626',
    disabledBackground: '#666666',
    disabledBackgroundEnd: '#444444',
    disabledText: '#666666',
    disabledOpacity: 0.5,
    inactiveBackground: '#444444',
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
  /**
   * TabBar navigation colors
   */
  tabBar: {
    active: '#FF5C45',
    inactive: 'rgba(255, 255, 255, 0.6)',
  },
  interactive: {
    surface: 'rgba(255, 255, 255, 0.04)',
    hoverSubtle: 'rgba(255, 255, 255, 0.06)',
    hoverStrong: 'rgba(255, 255, 255, 0.12)',
    hoverMedium: 'rgba(255, 255, 255, 0.15)',
    highlight: 'rgba(255, 255, 255, 0.2)',
  },
  overlay: {
    dark: 'rgba(15, 15, 15, 0.95)',
    darkHover: 'rgba(15, 15, 15, 0.9)',
  },
  skeleton: {
    base: 'rgba(64, 73, 98, 0.3)',
    highlight: 'rgba(64, 73, 98, 0.5)',
  },
  dialog: {
    overlay: 'rgba(0, 0, 0, 0.7)',
    background: '#10131c',
    border: '#404962',
  },
  card: {
    background: 'rgba(64, 73, 98, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderActive: '#FF5C45',
  },
  sheet: {
    backdrop: '#000000',
    handle: '#b9b9b9',
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
    solanaDevnet: {
      primary: '#00FFA3',      // Surge Green
      secondary: '#00CC82',    // Darker green accent
      gradient: ['#00FFA3', '#00B377', '#00664D'] as const,
    },
    solanaTestnet: {
      primary: '#03E1FF',      // Ocean Blue
      secondary: '#02B8CC',    // Darker blue accent
      gradient: ['#03E1FF', '#02A3B8', '#01667A'] as const,
    },
    bitcoin: {
      primary: '#F7931A',      // Bitcoin orange
      secondary: '#FFB84D',    // Lighter orange accent
      gradient: ['#F7931A', '#8B5A00', '#3D2800'] as const,
    },
    bitcoinTestnet: {
      primary: '#FF9500',      // Light orange
      secondary: '#E68600',    // Darker orange accent
      gradient: ['#FF9500', '#B36D00', '#663D00'] as const,
    },
    bitcoinSignet: {
      primary: '#6C63FF',      // Purple
      secondary: '#5A52E6',    // Darker purple accent
      gradient: ['#6C63FF', '#4A40B3', '#2A2466'] as const,
    },
    ethereum: {
      primary: '#627EEA',      // Ethereum blue
      secondary: '#C0C8F9',    // Light blue accent
      gradient: ['#627EEA', '#3A4A8C', '#1A1F33'] as const,
    },
    ethereumSepolia: {
      primary: '#4CAF50',      // Green
      secondary: '#388E3C',    // Darker green accent
      gradient: ['#4CAF50', '#2E7D32', '#1B5E20'] as const,
    },
    ethereumHolesky: {
      primary: '#FFA500',      // Orange
      secondary: '#E69500',    // Darker orange accent
      gradient: ['#FFA500', '#B37700', '#664400'] as const,
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
   * Balance card Solana Devnet gradient
   */
  balanceCardSolanaDevnet: {
    colors: ['#00FFA3', '#00B377', '#00664D'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Balance card Solana Testnet gradient
   */
  balanceCardSolanaTestnet: {
    colors: ['#03E1FF', '#02A3B8', '#01667A'] as const,
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
   * Balance card Bitcoin Testnet gradient
   */
  balanceCardBitcoinTestnet: {
    colors: ['#FF9500', '#B36D00', '#663D00'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Balance card Bitcoin Regtest gradient
   */
  balanceCardBitcoinRegtest: {
    colors: ['#6C63FF', '#4A40B3', '#2A2466'] as const,
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
   * Balance card Ethereum Sepolia gradient
   */
  balanceCardEthereumSepolia: {
    colors: ['#4CAF50', '#2E7D32', '#1B5E20'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  /**
   * Balance card Ethereum Goerli gradient
   */
  balanceCardEthereumGoerli: {
    colors: ['#FFA500', '#B37700', '#664400'] as const,
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
  /**
   * TabBar fade gradient (black to transparent, bottom to top)
   * Used for better UX when scrolling token list
   */
  tabBarFade: {
    colors: ['#000000', 'rgba(0, 0, 0, 0)'] as const,
    start: { x: 0.5, y: 1 }, // bottom
    end: { x: 0.5, y: 0 },   // top
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
  balanceCardSolanaCSS:
    'linear-gradient(180deg, #4A1A8C 0%, #2D1052 50%, #1A0A33 100%)',
  balanceCardSolanaDevnetCSS:
    'linear-gradient(180deg, #00FFA3 0%, #00B377 50%, #00664D 100%)',
  balanceCardBitcoinCSS:
    'linear-gradient(180deg, #F7931A 0%, #8B5A00 50%, #3D2800 100%)',
  balanceCardBitcoinTestnetCSS:
    'linear-gradient(180deg, #FF9500 0%, #B36D00 50%, #663D00 100%)',
  balanceCardEthereumCSS:
    'linear-gradient(180deg, #627EEA 0%, #3A4A8C 50%, #1A1F33 100%)',
  balanceCardEthereumSepoliaCSS:
    'linear-gradient(180deg, #4CAF50 0%, #2E7D32 50%, #1B5E20 100%)',
  /**
   * Glassy border radial gradient (Figma "Glassy_BORDER" style)
   * Circular radial centered at top-left corner (0,0), radiating to bottom-right.
   * Border visible at top-left & bottom-right corners, transparent in between.
   * Uses userSpaceOnUse — radius must be computed from element diagonal.
   */
  glassyBorder: {
    stops: [
      { offset: 0.2, color: '#404962', opacity: 1 },
      { offset: 0.4, color: '#404962', opacity: 0 },
      { offset: 0.6, color: '#404962', opacity: 0 },
      { offset: 0.8, color: '#404962', opacity: 1 },
    ] as const,
    width: 0.75,
  },
} as const;

export type Colors = typeof colors;
export type Gradients = typeof gradients;

// ============================================================================
// Blockchain Scale Overlay Colors
// ============================================================================

/**
 * Returns an rgba overlay color (15% opacity) for a blockchain.
 * Used for balance card scale/shimmer effects.
 */
export const getScalesColorForBlockchain = (blockchain: BlockchainId): string => {
  switch (blockchain) {
    case 'solana':
      return 'rgba(153, 69, 255, 0.15)';
    case 'solana-devnet':
      return 'rgba(0, 255, 163, 0.15)';
    case 'bitcoin':
      return 'rgba(247, 147, 26, 0.15)';
    case 'bitcoin-testnet':
      return 'rgba(255, 149, 0, 0.15)';
    case 'ethereum':
      return 'rgba(98, 126, 234, 0.15)';
    case 'ethereum-sepolia':
      return 'rgba(76, 175, 80, 0.15)';
    default:
      return 'rgba(153, 69, 255, 0.15)';
  }
};
