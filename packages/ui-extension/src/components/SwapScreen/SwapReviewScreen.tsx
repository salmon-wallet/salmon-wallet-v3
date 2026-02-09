/**
 * SwapReviewScreen - Second step of swap flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses CSS gradients instead of expo-linear-gradient.
 * Uses CSS overflow instead of RN ScrollView.
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
} from '@salmon/shared';
import { SwapReviewCard } from './SwapReviewCard';
import { SwapDetailRow } from './SwapDetailRow';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { SwapReviewScreenProps } from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format amount with symbol
 */
const formatAmountWithSymbol = (amount: number, symbol: string, decimals = 8): string => {
  const formatted = amount.toFixed(decimals).replace(/\.?0+$/, '');
  return `${formatted} ${symbol}`;
};

/**
 * Format fee percentage
 */
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Format SOL amount for fees
 */
const formatSolFee = (lamports: number): string => {
  const sol = lamports / 1_000_000_000;
  return `${sol.toFixed(7).replace(/\.?0+$/, '')} SOL`;
};

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

const BackgroundPattern = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 200,
  opacity: 0.4,
  pointerEvents: 'none',
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
  marginBottom: spacing['3xl'],
});

const PriceImpactContainer = styled(Box)({
  marginBottom: spacing.lg,
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
// SwapReviewScreen Component
// ============================================================================

/**
 * SwapReviewScreen - Second step of swap flow
 * Shows quote details and confirm/back buttons
 */
export function SwapReviewScreen({
  quote,
  inToken,
  outToken,
  onBack,
  onConfirm,
  isConfirming = false,
  style,
}: SwapReviewScreenProps): React.ReactElement {
  const { input, output, fee, details } = quote;

  return (
    <Container style={style}>
      {/* Background Pattern */}
      <BackgroundPattern />

      {/* Title */}
      <Title>Swap Review</Title>

      {/* Scrollable Content */}
      <ScrollContainer>
        <ScrollContent>
          {/* Send/Receive Cards */}
          <CardsContainer>
            <SwapReviewCard
              label="You Send"
              amount={formatAmountWithSymbol(input.amount, input.symbol)}
            />
            <SwapReviewCard
              label="You Receive"
              amount={formatAmountWithSymbol(output.amount, output.symbol)}
            />
          </CardsContainer>

          {/* Details Section */}
          <DetailsContainer>
            <SwapDetailRow
              label="Salmon fee"
              value={formatPercent(fee.percent)}
            />
            <SwapDetailRow
              label="Router"
              value={details.router}
            />
            <SwapDetailRow
              label="Priority Fee"
              value={formatSolFee(details.priorityFee)}
            />
            <SwapDetailRow
              label="Rent Fee"
              value={formatSolFee(details.rentFee)}
            />
            <SwapDetailRow
              label="Slippage Tolerance"
              value={formatPercent(details.slippageBps / 100)}
            />
            <SwapDetailRow
              label="Minimum Received"
              value={formatAmountWithSymbol(details.minimumReceived, output.symbol)}
            />
            <SwapDetailRow
              label="Swap Mode"
              value={details.swapMode}
            />
          </DetailsContainer>

          {/* Price Impact (highlighted) */}
          <PriceImpactContainer>
            <SwapDetailRow
              label="Total Price Impact"
              value={formatPercent(details.priceImpact)}
            />
          </PriceImpactContainer>
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
            Confirm
          </PrimaryButton>
        </ConfirmButtonGradient>
      </ButtonsContainer>
    </Container>
  );
}

export default SwapReviewScreen;
