/**
 * BaseDialog.Header - Header with title and close button
 */

import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  StyledDialogTitle,
  TitleContainer,
  TitleText,
  WarningIcon,
  CloseButton,
} from './styles';
import { useBaseDialog } from './BaseDialog';
import type { HeaderProps } from './types';

export function Header({
  title,
  showWarning = false,
  onClose,
}: HeaderProps): React.ReactElement {
  const context = useBaseDialog();
  const handleClose = onClose || context.onClose;

  return (
    <StyledDialogTitle>
      <TitleContainer>
        {showWarning && <WarningIcon />}
        <TitleText>{title}</TitleText>
      </TitleContainer>
      <CloseButton onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </CloseButton>
    </StyledDialogTitle>
  );
}
