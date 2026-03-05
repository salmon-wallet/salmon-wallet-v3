/**
 * BridgeReviewScreen - Third step of bridge flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Shows bridge details and confirm/back buttons.
 * Reuses SwapDetailRow and SwapReviewCard components from SwapScreen.
 */
import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  fontWeight,
  formatAmountWithSymbol,
  getShortAddress,
  fontSize,
} from '@salmon/shared';
import { SwapDetailRow } from '../SwapScreen/SwapDetailRow';
import { SwapReviewCard } from '../SwapScreen/SwapReviewCard';
import { SwapReviewButtons } from '../SwapScreen/SwapReviewButtons';
import type { BridgeReviewScreenProps } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
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
  marginBottom: spacing['2xl'],
});

const ScrollContainer = styled(Box)({
  flex: 1,
  minHeight: 0,
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
  backgroundColor: colors.status.warningBackground,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.status.warningBorder}`,
  padding: spacing.base,
  marginBottom: spacing.lg,
});

const WarningTitle = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.status.warning,
  marginBottom: spacing.xs,
  letterSpacing: 0.02,
});

const WarningText = styled(Typography)({
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  letterSpacing: 0.018,
  lineHeight: '18px',
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
  confirmLabel,
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
            <SwapReviewCard
              label="You Send"
              amount={formatAmountWithSymbol(inAmount, inToken.symbol)}
            />
            <SwapReviewCard
              label="You Receive (estimated)"
              amount={formatAmountWithSymbol(outAmount, outToken.symbol)}
            />
          </CardsContainer>

          {/* Details Section */}
          <DetailsContainer>
            <SwapDetailRow
              label="Recipient"
              value={getShortAddress(recipientAddress, 8) ?? ''}
            />
            <SwapDetailRow
              label="From Network"
              value={inToken.network || 'Solana'}
            />
            <SwapDetailRow
              label="To Network"
              value={outToken.network || 'Unknown'}
            />
            {estimate && (
              <>
                <SwapDetailRow
                  label="Minimum Amount"
                  value={formatAmountWithSymbol(
                    estimate.minAmount,
                    inToken.symbol
                  )}
                />
                <SwapDetailRow
                  label="Estimated Output"
                  value={formatAmountWithSymbol(
                    estimate.estimatedAmount,
                    outToken.symbol
                  )}
                />
              </>
            )}
            <SwapDetailRow label="Provider" value="StealthEX" />
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
      <SwapReviewButtons
        onBack={onBack}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        confirmLabel={confirmLabel ?? 'Confirm Swap'}
      />
    </Container>
  );
};

export default BridgeReviewScreen;
