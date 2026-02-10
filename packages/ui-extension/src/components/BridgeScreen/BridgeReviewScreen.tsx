/**
 * BridgeReviewScreen - Third step of bridge flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Shows bridge details and confirm/back buttons.
 * Uses CSS backgrounds instead of expo-blur and expo-linear-gradient.
 */
import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  gradients,
  fontFamily,
  fontWeight,
  formatAmountWithSymbol,
  getShortAddress,
} from '@salmon/shared';
import { BlurContainer } from '../BlurContainer';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { BridgeReviewScreenProps } from './types';

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * BridgeDetailRow - A single row in the bridge details section
 * Reuses the BlurContainer pattern from SwapDetailRow
 */
const DetailBlurContent = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.sm}px ${spacing.base}px`,
  minHeight: 40,
});

const DetailLabel = styled(Typography)({
  fontSize: 15,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.075,
  lineHeight: `${15 * 1.5}px`,
});

const DetailValue = styled(Typography)({
  fontSize: 15,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.075,
  lineHeight: `${15 * 1.5}px`,
  flexShrink: 1,
  textAlign: 'right',
});

const BridgeDetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <BlurContainer
    blurIntensity={5}
    blurTint="dark"
    style={{
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    }}
  >
    <DetailBlurContent>
      <DetailLabel>{label}</DetailLabel>
      <DetailValue>{value}</DetailValue>
    </DetailBlurContent>
  </BlurContainer>
);

/**
 * BridgeReviewCard - Card displaying token amount for review screen
 * Reuses the BlurContainer pattern from SwapReviewCard
 */
const CardBlurContent = styled('div')({
  padding: `${spacing.sm}px ${spacing.base}px`,
  minHeight: 75,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

const CardLabel = styled(Typography)({
  fontSize: 15,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.075,
  lineHeight: `${15 * 1.5}px`,
});

const CardAmount = styled(Typography)({
  fontSize: 25,
  fontWeight: fontWeight.bold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  letterSpacing: -0.12,
  lineHeight: '25px',
  marginTop: 2,
});

const BridgeReviewCard: React.FC<{ label: string; amount: string }> = ({
  label,
  amount,
}) => (
  <BlurContainer
    blurIntensity={5}
    blurTint="dark"
    style={{
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    }}
  >
    <CardBlurContent>
      <CardLabel>{label}</CardLabel>
      <CardAmount>{amount}</CardAmount>
    </CardBlurContent>
  </BlurContainer>
);

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
  fontSize: 24,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.primary,
  textAlign: 'center',
  letterSpacing: 0.24,
  lineHeight: `${24 * 1.3}px`,
  marginBottom: spacing['2xl'],
});

const ScrollContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
});

const ScrollContent = styled(Box)({
  paddingBottom: spacing['4xl'],
});

const CardsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  marginBottom: spacing['2xl'],
});

const DetailsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md - 3,
  marginBottom: spacing['2xl'],
});

const WarningBox = styled(Box)({
  backgroundColor: 'rgba(255, 179, 0, 0.1)',
  borderRadius: borderRadius.md,
  border: '1px solid rgba(255, 179, 0, 0.3)',
  padding: spacing.base,
  marginBottom: spacing.lg,
});

const WarningTitle = styled(Typography)({
  fontSize: 13,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.status.warning,
  marginBottom: spacing.xs,
  letterSpacing: 0.02,
});

const WarningText = styled(Typography)({
  fontSize: 12,
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
  paddingBottom: spacing['2xl'],
});

const BackButtonWrapper = styled('div')({
  flex: 1,
});

const ConfirmButtonGradient = styled('div')({
  flex: 1,
  borderRadius: borderRadius.lg,
  border: '0.8px solid rgba(255, 92, 69, 0.8)',
  boxShadow: '0 0 12px rgba(0, 0, 0, 0.64)',
  background: gradients.primaryCSS,
});

// ============================================================================
// BridgeReviewScreen Component
// ============================================================================

/**
 * BridgeReviewScreen - Third step of bridge flow
 * Shows bridge details and confirm/back buttons
 */
export const BridgeReviewScreen: React.FC<BridgeReviewScreenProps> = ({
  inToken,
  outToken,
  inAmount,
  outAmount,
  recipientAddress,
  estimate,
  onBack,
  onConfirm,
  isConfirming = false,
  style,
}) => {
  return (
    <Container style={style}>
      {/* Title */}
      <Title>Swap Review</Title>

      {/* Scrollable Content */}
      <ScrollContainer>
        <ScrollContent>
          {/* Send/Receive Cards */}
          <CardsContainer>
            <BridgeReviewCard
              label="You Send"
              amount={formatAmountWithSymbol(inAmount, inToken.symbol)}
            />
            <BridgeReviewCard
              label="You Receive (estimated)"
              amount={formatAmountWithSymbol(outAmount, outToken.symbol)}
            />
          </CardsContainer>

          {/* Details Section */}
          <DetailsContainer>
            <BridgeDetailRow
              label="Recipient"
              value={getShortAddress(recipientAddress, 8) ?? ''}
            />
            <BridgeDetailRow
              label="From Network"
              value={inToken.network || 'Solana'}
            />
            <BridgeDetailRow
              label="To Network"
              value={outToken.network || 'Unknown'}
            />
            {estimate && (
              <>
                <BridgeDetailRow
                  label="Minimum Amount"
                  value={formatAmountWithSymbol(
                    estimate.minAmount,
                    inToken.symbol
                  )}
                />
                <BridgeDetailRow
                  label="Estimated Output"
                  value={formatAmountWithSymbol(
                    estimate.estimatedAmount,
                    outToken.symbol
                  )}
                />
              </>
            )}
            <BridgeDetailRow label="Provider" value="StealthEX" />
          </DetailsContainer>

          {/* Warning Box */}
          <WarningBox>
            <WarningTitle>Please Note</WarningTitle>
            <WarningText>
              Cross-chain swaps typically take 10-30 minutes to complete. You
              will receive a deposit address after confirmation.
            </WarningText>
          </WarningBox>
        </ScrollContent>
      </ScrollContainer>

      {/* Buttons */}
      <ButtonsContainer>
        <BackButtonWrapper>
          <SecondaryButton
            onClick={onBack}
            disabled={isConfirming}
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
        <ConfirmButtonGradient>
          <PrimaryButton
            onClick={onConfirm}
            loading={isConfirming}
            disabled={isConfirming}
            style={{
              height: 42,
              background: 'transparent',
            }}
          >
            Confirm Swap
          </PrimaryButton>
        </ConfirmButtonGradient>
      </ButtonsContainer>
    </Container>
  );
};

export default BridgeReviewScreen;
