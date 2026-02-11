/**
 * Type definitions for BaseSheetDialog compound component
 */

import type { CSSProperties, ReactNode } from 'react';

// ============================================================================
// Root Dialog Props
// ============================================================================

export interface BaseSheetDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog content (use BaseSheetDialog sub-components) */
  children: ReactNode;
  /** Dialog size preset */
  size?: 'small' | 'medium' | 'large';
  /** Color scheme for background and border */
  colorScheme?: 'dialog' | 'secondary';
  /** Whether to show ScalesBackground decorative pattern */
  showScalesBackground?: boolean;
  /** Optional additional className */
  className?: string;
  /** Optional inline styles for paper */
  style?: CSSProperties;
  /** Optional aria-labelledby for accessibility */
  ariaLabelledBy?: string;
}

// ============================================================================
// Header Component Props
// ============================================================================

export interface StandardHeaderProps {
  /** Header title */
  title: string;
  /** Optional close handler (uses context if not provided) */
  onClose?: () => void;
}

export interface HandleHeaderProps {
  /** Header title */
  title: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
}

// ============================================================================
// Content Component Props
// ============================================================================

export interface ContentProps {
  /** Content to display */
  children: ReactNode;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether content should be scrollable */
  scrollable?: boolean;
  /** Optional additional className */
  className?: string;
  /** Optional inline styles */
  style?: CSSProperties;
}

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Size presets for dialog dimensions
 */
export const SIZE_PRESETS = {
  small: {
    minWidth: 360,
    maxWidth: 400,
    maxHeight: '80vh',
  },
  medium: {
    minWidth: 380,
    maxWidth: 440,
    maxHeight: '85vh',
  },
  large: {
    minWidth: 380,
    maxWidth: 440,
    height: '85vh',
    maxHeight: 700,
  },
} as const;

/**
 * Padding presets for content area
 */
export const PADDING_PRESETS = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
} as const;
