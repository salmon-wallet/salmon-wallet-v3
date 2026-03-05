import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import { colors, spacing, borderRadius, gradients, shadowsCSS, componentSizes } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';

export interface SwapReviewButtonsProps {
  onBack: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  confirmLabel?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// Styled Components
// ============================================================================

const ButtonsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing.md,
  paddingBottom: spacing['2xl'],
});

const BackButtonWrapper = styled('div')({
  flex: 1,
});

const ConfirmButtonGradient = styled('div')({
  flex: 1,
  borderRadius: borderRadius.lg,
  border: `0.8px solid ${colors.accent.border}`,
  boxShadow: shadowsCSS.button,
  background: gradients.primaryCSS,
});

// ============================================================================
// SwapReviewButtons Component
// ============================================================================

/**
 * SwapReviewButtons - Shared Back/Confirm buttons for review screens
 * Used by SwapReviewScreen and BridgeReviewScreen
 */
export const SwapReviewButtons: React.FC<SwapReviewButtonsProps> = ({
  onBack,
  onConfirm,
  isConfirming = false,
  confirmLabel = 'Confirm',
  style,
}) => {
  return (
    <ButtonsContainer style={style}>
      <BackButtonWrapper>
        <SecondaryButton
          onClick={onBack}
          disabled={isConfirming}
          style={{
            height: componentSizes.buttonHeightCompact,
            border: `0.8px solid ${colors.accent.border}`,
            borderRadius: borderRadius.lg,
            backgroundColor: colors.button.cancelBackground,
          }}
        >
          Back
        </SecondaryButton>
      </BackButtonWrapper>
      <ConfirmButtonGradient>
        <PrimaryButton
          onClick={onConfirm}
          loading={isConfirming}
          disabled={isConfirming}
          style={{
            height: componentSizes.buttonHeightCompact,
            background: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          {confirmLabel}
        </PrimaryButton>
      </ConfirmButtonGradient>
    </ButtonsContainer>
  );
};
