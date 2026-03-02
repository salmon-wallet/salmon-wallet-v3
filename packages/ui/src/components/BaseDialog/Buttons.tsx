/**
 * BaseDialog Button Components
 */

import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { StyledCancelButton, StyledActionButton } from './styles';
import type { CancelButtonProps, ActionButtonProps } from './types';

/**
 * Secondary/Cancel button
 */
export function CancelButton({
  children,
  onClick,
  disabled = false,
}: CancelButtonProps): React.ReactElement {
  return (
    <StyledCancelButton onClick={onClick} disabled={disabled}>
      {children}
    </StyledCancelButton>
  );
}

/**
 * Primary/Action button with optional danger styling and loading state
 */
export function ActionButton({
  children,
  onClick,
  disabled = false,
  isDanger = false,
  loading = false,
}: ActionButtonProps): React.ReactElement {
  return (
    <StyledActionButton
      $isDanger={isDanger}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: 'inherit' }} />
      ) : (
        children
      )}
    </StyledActionButton>
  );
}
