/**
 * BaseDialog.Actions - Actions area with buttons
 */

import React from 'react';
import { StyledDialogActions } from './styles';
import type { ActionsProps } from './types';

export function Actions({ children }: ActionsProps): React.ReactElement {
  return <StyledDialogActions>{children}</StyledDialogActions>;
}
