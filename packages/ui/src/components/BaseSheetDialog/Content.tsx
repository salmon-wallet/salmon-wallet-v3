/**
 * Content - Scrollable content area with custom scrollbar
 *
 * @example
 * ```tsx
 * <BaseSheetDialog.Content padding="lg">
 *   {content}
 * </BaseSheetDialog.Content>
 * ```
 */

import React from 'react';
import { styled } from '../../utils/styled';
import DialogContent from '@mui/material/DialogContent';
import { PADDING_PRESETS } from './types';
import type { ContentProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialogContent = styled(DialogContent)<{
  $padding: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  $scrollable: boolean;
}>(({ $padding, $scrollable }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: PADDING_PRESETS[$padding],
  position: 'relative',
  zIndex: 1,
  ...($scrollable && {
    overflowY: 'auto',
    /* Custom scrollbar styling */
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.3)',
      },
    },
  }),
}));

// ============================================================================
// Component
// ============================================================================

/**
 * Content - Scrollable content area
 */
export function Content({
  children,
  padding = 'lg',
  scrollable = true,
  className,
  style,
}: ContentProps): React.ReactElement {
  return (
    <StyledDialogContent
      $padding={padding}
      $scrollable={scrollable}
      className={className}
      style={style}
    >
      {children}
    </StyledDialogContent>
  );
}
