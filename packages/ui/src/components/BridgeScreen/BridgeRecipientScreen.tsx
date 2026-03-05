/**
 * BridgeRecipientScreen - Second step of bridge flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Allows user to enter the recipient address for the destination chain.
 */
import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  gradients,
  fontFamily,
  fontWeight,
  fontSize,
} from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { BridgeRecipientScreenProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: `${spacing['2xl']}px ${spacing.headerPadding}px 0`,
  position: 'relative',
});

const Title = styled(Typography)({
  fontSize: fontSize['2xl'],
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textAlign: 'center',
  letterSpacing: 0.24,
  lineHeight: `${24 * 1.3}px`,
  marginBottom: spacing.md,
});

const Description = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  textAlign: 'center',
  letterSpacing: 0.02,
  lineHeight: '20px',
  marginBottom: spacing['2xl'],
});

const InputContainer = styled(Box)({
  marginBottom: spacing['2xl'],
});

const AddressInput = styled('input')({
  width: '100%',
  padding: `${spacing.sm}px ${spacing.base}px`,
  minHeight: 48,
  backgroundColor: colors.background.tokenItem,
  border: `1px solid ${colors.border.default}`,
  borderRadius: borderRadius.md,
  color: colors.text.primary,
  fontSize: fontSize.base,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: fontWeight.medium,
  letterSpacing: 0.02,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  '&::placeholder': {
    color: colors.text.tertiary,
  },
  '&:focus': {
    borderColor: 'rgba(255, 92, 69, 0.6)',
  },
});

const ErrorText = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.status.error,
  marginTop: spacing.xs,
  letterSpacing: 0.02,
});

const InfoBox = styled(Box)({
  backgroundColor: colors.background.tokenItem,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
  padding: spacing.base,
  marginBottom: spacing['2xl'],
});

const InfoTitle = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.status.warning,
  marginBottom: spacing.xs,
  letterSpacing: 0.02,
});

const InfoText = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  letterSpacing: 0.018,
  lineHeight: '18px',
});

const ButtonsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing.md,
  marginTop: 'auto',
  paddingBottom: spacing['2xl'],
});

const BackButtonWrapper = styled('div')({
  flex: 1,
});

const ContinueButtonGradient = styled('div')({
  flex: 1,
  borderRadius: borderRadius.lg,
  border: '0.8px solid rgba(255, 92, 69, 0.8)',
  boxShadow: '0 0 12px rgba(0, 0, 0, 0.64)',
  background: gradients.primaryCSS,
});

// ============================================================================
// BridgeRecipientScreen Component
// ============================================================================

/**
 * BridgeRecipientScreen - Second step of bridge flow
 * Allows user to enter the recipient address for the destination chain
 */
export const BridgeRecipientScreen: React.FC<BridgeRecipientScreenProps> = ({
  recipientAddress,
  onAddressChange,
  targetChain,
  onBack,
  onContinue,
  isValidAddress,
  addressError,
  style,
}) => {
  const canContinue = isValidAddress && recipientAddress.length > 0;

  return (
    <Container style={style}>
      {/* Title */}
      <Title>Recipient Address</Title>

      {/* Description */}
      <Description>
        Enter the address where you want to receive your swapped tokens
        {targetChain ? ` on ${targetChain.name}` : ''}.
      </Description>

      {/* Address Input */}
      <InputContainer>
        <AddressInput
          value={recipientAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter recipient address"
        />
        {addressError && <ErrorText>{addressError}</ErrorText>}
      </InputContainer>

      {/* Info Box */}
      <InfoBox>
        <InfoTitle>Important</InfoTitle>
        <InfoText>
          Make sure the address is correct. Cross-chain transactions cannot be
          reversed once initiated.
        </InfoText>
      </InfoBox>

      {/* Buttons */}
      <ButtonsContainer>
        <BackButtonWrapper>
          <SecondaryButton
            onClick={onBack}
            style={{
              height: 42,
              border: '0.8px solid rgba(255, 92, 69, 0.8)',
              borderRadius: borderRadius.lg,
              backgroundColor: '#1f232f',
            }}
          >
            Back
          </SecondaryButton>
        </BackButtonWrapper>
        <ContinueButtonGradient>
          <PrimaryButton
            onClick={onContinue}
            disabled={!canContinue}
            style={{
              height: 42,
              background: 'transparent',
            }}
          >
            Review
          </PrimaryButton>
        </ContinueButtonGradient>
      </ButtonsContainer>
    </Container>
  );
};

export default BridgeRecipientScreen;
