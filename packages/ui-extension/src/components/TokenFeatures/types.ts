import type { CSSProperties } from 'react';

/**
 * Individual token feature/characteristic
 */
export interface TokenFeature {
  /** Feature name (e.g., "Native Token", "DeFi", "Governance") */
  label: string;
  /** Optional icon name (uses Material UI icons) */
  icon?: string;
  /** Badge background color (defaults to accent color) */
  color?: string;
}

/**
 * Props for the TokenFeatures component
 * Displays a horizontal scrollable row of feature badges/chips
 */
export interface TokenFeaturesProps {
  /** Array of token features to display */
  features: TokenFeature[];
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Optional custom styles for the container */
  style?: CSSProperties;
  /** Optional className for the container */
  className?: string;
}
