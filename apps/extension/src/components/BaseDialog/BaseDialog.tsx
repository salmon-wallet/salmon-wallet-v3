/**
 * BaseDialog - Root component for compound dialog
 *
 * This is the root component that wraps MUI Dialog with pre-configured styling
 * and provides context for sub-components (Header, Content, Actions, etc).
 *
 * @example
 * ```tsx
 * <BaseDialog visible={visible} onClose={onClose}>
 *   <BaseDialog.Header title="Confirm Action" showWarning />
 *   <BaseDialog.Content>
 *     <p>Are you sure?</p>
 *   </BaseDialog.Content>
 *   <BaseDialog.Actions>
 *     <BaseDialog.CancelButton onClick={onClose}>Cancel</BaseDialog.CancelButton>
 *     <BaseDialog.ActionButton onClick={handleConfirm}>Confirm</BaseDialog.ActionButton>
 *   </BaseDialog.Actions>
 * </BaseDialog>
 * ```
 */

import React, { createContext, useContext } from 'react';
import { StyledDialog } from './styles';
import type { BaseDialogProps } from './types';

// ============================================================================
// Context
// ============================================================================

interface BaseDialogContextValue {
  onClose: () => void;
}

const BaseDialogContext = createContext<BaseDialogContextValue | null>(null);

/**
 * Hook to access BaseDialog context (used by sub-components)
 */
export function useBaseDialog(): BaseDialogContextValue {
  const context = useContext(BaseDialogContext);
  if (!context) {
    throw new Error('BaseDialog sub-components must be used within BaseDialog');
  }
  return context;
}

// ============================================================================
// Root Component
// ============================================================================

/**
 * BaseDialog - Root dialog wrapper component
 */
export function BaseDialog({
  visible,
  onClose,
  children,
  ariaLabelledBy,
}: BaseDialogProps): React.ReactElement {
  const contextValue: BaseDialogContextValue = { onClose };

  return (
    <BaseDialogContext.Provider value={contextValue}>
      <StyledDialog
        open={visible}
        onClose={onClose}
        aria-labelledby={ariaLabelledBy}
        disableEnforceFocus
      >
        {children}
      </StyledDialog>
    </BaseDialogContext.Provider>
  );
}
