/**
 * Type definitions for BaseSheetDialog compound component
 */

import type { CSSProperties, ReactNode } from 'react';
import { componentSizes, spacing } from '@salmon/shared';

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
    minWidth: 'min(360px, 95vw)',
    maxWidth: 'min(400px, 95vw)',
    maxHeight: '80vh',
  },
  medium: {
    minWidth: 'min(380px, 95vw)',
    maxWidth: 'min(440px, 95vw)',
    maxHeight: '85vh',
  },
  large: {
    minWidth: 'min(380px, 95vw)',
    maxWidth: 'min(440px, 95vw)',
    height: '85vh',
    maxHeight: componentSizes.sheetMaxHeight,
  },
} as const;

/**
 * Padding presets for content area
 */
export const PADDING_PRESETS = {
  none: spacing.none,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.xl,
  xl: spacing['2xl'],
} as const;
