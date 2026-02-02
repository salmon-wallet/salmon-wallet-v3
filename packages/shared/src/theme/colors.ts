/**
 * Color tokens for Salmon Wallet
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

export const colors = {
  background: {
    primary: '#10131c', // bg-darken
    secondary: '#161c2d',
    card: 'rgba(255, 255, 255, 0.05)',
    glass: 'rgba(0, 0, 0, 0.4)', // glass effect
  },
  text: {
    primary: '#FFFFFF', // Unificado a blanco puro
    secondary: '#8A8D98', // Actualizado para mejor legibilidad
    muted: 'rgba(255, 255, 255, 0.7)',
    placeholder: '#6B6E7B',
  },
  border: {
    default: '#404962',
    light: 'rgba(255, 255, 255, 0.8)',
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
  // CSS version for web
  primaryCSS:
    'linear-gradient(101deg, rgb(255, 92, 69) 12%, rgba(161, 42, 42, 0.9) 83%)',
} as const;

export type Colors = typeof colors;
export type Gradients = typeof gradients;
