/**
 * Shared styled components for BaseSheetDialog
 */

import { styled } from '../../utils/styled';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import Box, { type BoxProps } from '@mui/material/Box';
import { colors, borderRadius } from '@salmon/shared';
import { SIZE_PRESETS } from './types';
import type { ComponentType } from 'react';

// ============================================================================
// Color Schemes
// ============================================================================

export const COLOR_SCHEMES = {
  dialog: {
    background: colors.background.primary,
    border: colors.border.default,
  },
  secondary: {
    background: colors.background.secondary,
    border: colors.border.default,
  },
} as const;

// ============================================================================
// Styled Components
// ============================================================================

/**
 * StyledDialog - Main dialog wrapper with size and color scheme support
 */
export const StyledDialog: ComponentType<
  DialogProps & {
    $colorScheme: 'dialog' | 'secondary';
    $size: 'small' | 'medium' | 'large';
  }
> = styled(Dialog)<{
  $colorScheme: 'dialog' | 'secondary';
  $size: 'small' | 'medium' | 'large';
}>(({ $colorScheme, $size }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: COLOR_SCHEMES[$colorScheme].background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${COLOR_SCHEMES[$colorScheme].border}`,
    ...SIZE_PRESETS[$size],
    overflow: 'hidden',
    position: 'relative',
  },
}));

/**
 * BackgroundWrapper - Container for ScalesBackground
 */
export const BackgroundWrapper: ComponentType<BoxProps> = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  borderRadius: `${borderRadius.xl}px`,
});
