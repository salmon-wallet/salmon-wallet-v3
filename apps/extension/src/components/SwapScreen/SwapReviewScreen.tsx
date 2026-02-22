/**
 * SwapReviewScreen - Second step of swap flow
 *
 * Web version using MUI and @emotion/styled for browser extension.
 * Uses CSS gradients instead of expo-linear-gradient.
 * Uses CSS overflow instead of RN ScrollView.
 */
import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  fontWeight,
  useCurrencyContext,
  formatAmountWithSymbol,
  formatSolFee,
  formatPercent,
} from '@salmon/shared';
import { SwapReviewCard } from './SwapReviewCard';
import { SwapDetailRow } from './SwapDetailRow';
import { SwapReviewButtons } from './SwapReviewButtons';
import type { SwapReviewScreenProps } from './types';

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
  marginBottom: spacing['3xl'],
});

const PriceImpactContainer = styled(Box)({
  marginBottom: spacing.lg,
});

const WarningBox = styled(Box)({
  backgroundColor: 'rgba(255, 179, 0, 0.1)',
  borderRadius: spacing.md,
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

const WarningBodyText = styled(Typography)({
  fontSize: 12,
  fontWeight: fontWeight.medium,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  color: colors.text.secondary,
  lineHeight: `${12 * 1.5}px`,
  letterSpacing: 0.01,
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
  inAmount,
  outAmount,
  onBack,
  onConfirm,
  isConfirming = false,
  confirmLabel,
  style,
}: SwapReviewScreenProps): React.ReactElement {
  const [, { formatValue }] = useCurrencyContext();
  const formatUsd = (value: number | undefined): string | undefined =>
    value != null ? `~${formatValue(value)}` : undefined;

  // Extract swap data for display (custom contains all swap details from backend)
  const { input, output, fee, routeNames, custom: details } = quote;

  // Derive display amounts with fallbacks when quote.input/output are missing
  const inDecimals = input?.decimals ?? inToken.decimals;
  const outDecimals = output?.decimals ?? outToken.decimals;
  const inSymbol = input?.symbol ?? inToken.symbol;
  const outSymbol = output?.symbol ?? outToken.symbol;

  const displayInAmount = input?.amount != null
    ? Number(input.amount) / (10 ** inDecimals)
    : parseFloat(inAmount || '0') || 0;
  const displayOutAmount = output?.amount != null
    ? Number(output.amount) / (10 ** outDecimals)
    : parseFloat(outAmount || '0') || 0;

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
              amount={formatAmountWithSymbol(displayInAmount, inSymbol)}
              usdValue={formatUsd(details?.inUsdValue)}
            />
            <SwapReviewCard
              label="You Receive"
              amount={formatAmountWithSymbol(displayOutAmount, outSymbol)}
              usdValue={formatUsd(details?.outUsdValue)}
            />
          </CardsContainer>

          {/* Details Section */}
          <DetailsContainer>
            {fee && (
              <SwapDetailRow
                label="Salmon fee"
                value={formatPercent(fee.percent)}
              />
            )}
            {details?.router && (
              <SwapDetailRow
                label="Router"
                value={details.router}
              />
            )}
            {routeNames && routeNames.length > 0 && (
              <SwapDetailRow
                label="Route"
                value={routeNames.join(' → ')}
              />
            )}
            {details?.gasless && (
              <SwapDetailRow
                label="Gasless"
                value="Yes"
              />
            )}
            {details?.prioritizationFeeLamports != null && (
              <SwapDetailRow
                label="Priority Fee"
                value={formatSolFee(details.prioritizationFeeLamports)}
              />
            )}
            {details?.rentFeeLamports != null && (
              <SwapDetailRow
                label="Rent Fee"
                value={formatSolFee(details.rentFeeLamports)}
              />
            )}
            {details?.slippageBps != null && (
              <SwapDetailRow
                label="Slippage Tolerance"
                value={formatPercent(details.slippageBps / 100)}
              />
            )}
            {details?.otherAmountThreshold != null && (
              <SwapDetailRow
                label="Minimum Received"
                value={formatAmountWithSymbol(Number(details.otherAmountThreshold) / (10 ** outDecimals), outSymbol)}
              />
            )}
            {details?.swapMode && (
              <SwapDetailRow
                label="Swap Mode"
                value={details.swapMode}
              />
            )}
          </DetailsContainer>

          {/* Price Impact (highlighted) */}
          {details?.priceImpact != null && (
            <PriceImpactContainer>
              <SwapDetailRow
                label="Total Price Impact"
                value={formatPercent(details.priceImpact)}
              />
            </PriceImpactContainer>
          )}

          {/* Warning Box */}
          <WarningBox>
            <WarningTitle>Please Note</WarningTitle>
            <WarningBodyText>
              Swap rates are estimates. The actual amount you receive may differ due to slippage and market conditions. Transactions are irreversible once confirmed.
            </WarningBodyText>
          </WarningBox>
        </ScrollContent>
      </ScrollContainer>

      {/* Buttons */}
      <SwapReviewButtons
        onBack={onBack}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        confirmLabel={confirmLabel ?? 'Confirm'}
      />
    </Container>
  );
}

export default SwapReviewScreen;
