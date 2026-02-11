/**
 * BaseDialog.Content - Content area wrapper
 */

import React from 'react';
import { StyledDialogContent } from './styles';
import type { ContentProps } from './types';

export function Content({ children }: ContentProps): React.ReactElement {
  return <StyledDialogContent>{children}</StyledDialogContent>;
}
