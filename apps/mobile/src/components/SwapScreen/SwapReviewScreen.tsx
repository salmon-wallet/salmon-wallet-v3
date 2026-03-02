import { borderRadius, colors, componentSizes, fontFamilyNative, formatAmountWithSymbol, formatSolFee, formatPercent, ms, s, spacing, useCurrencyContext, vs } from '@salmon/shared';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurContainer } from '../BlurContainer';
import { SwapDetailRow } from './SwapDetailRow';
import { SwapReviewCard } from './SwapReviewCard';
import { SwapReviewButtons } from './SwapReviewButtons';
import type { SwapReviewScreenProps } from './types';

/**
 * SwapReviewScreen - Second step of swap flow
 * Shows quote details and confirm/back buttons
 */
export const SwapReviewScreen: React.FC<SwapReviewScreenProps> = ({
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
}) => {
  const [, { formatValue }] = useCurrencyContext();
  const formatUsd = (value: number | undefined): string | undefined =>
    value != null ? `~${formatValue(value)}` : undefined;

  // Extract data from backend response structure (custom contains all swap details)
  const { input, output, fee, routeNames, custom: details } = quote;

  // Derive display values with fallbacks when quote.input/output are missing
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
    <View style={[styles.container, style]}>
      {/* Background Pattern - subtle swap graphic */}
      <View style={styles.backgroundPattern}>
        {/* This would be the swap background image from Figma */}
      </View>

      {/* Title */}
      <Text style={styles.title}>Swap Review</Text>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Send/Receive Cards */}
        <View style={styles.cardsContainer}>
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
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
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
          {details?.priceImpact != null && (
            <SwapDetailRow
              label="Total Price Impact"
              value={formatPercent(details.priceImpact)}
            />
          )}
        </View>

        {/* Warning Box */}
        <BlurContainer
          borderColor={colors.palette.amber}
          backgroundColor="rgba(255, 179, 0, 0.1)"
          style={styles.warningBox}
        >
          <Text style={styles.warningTitle}>Please Note</Text>
          <Text style={styles.warningText}>
            Swap rates are estimates. The actual amount you receive may differ due to slippage and market conditions. Transactions are irreversible once confirmed.
          </Text>
        </BlurContainer>
      </ScrollView>

      {/* Buttons */}
      <SwapReviewButtons
        onBack={onBack}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        confirmLabel={confirmLabel ?? 'Confirm'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: s(spacing.headerPadding),
    paddingTop: vs(spacing['2xl']),
    paddingBottom: vs(componentSizes.tabBarHeight + spacing.xl),
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(200),
    opacity: 0.4,
  },
  title: {
    fontSize: ms(24),
    fontFamily: fontFamilyNative.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.24,
    lineHeight: ms(24 * 1.3),
    marginBottom: vs(spacing['2xl']),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vs(spacing['4xl']),
  },
  cardsContainer: {
    gap: vs(spacing.md),
    marginBottom: vs(spacing['2xl']),
  },
  detailsContainer: {
    gap: vs(spacing.md - 3),
    marginBottom: vs(spacing['3xl']),
  },
  warningBox: {
    borderRadius: borderRadius.md,
    padding: s(spacing.base),
    marginBottom: vs(spacing.lg),
  },
  warningTitle: {
    fontSize: ms(13),
    fontFamily: fontFamilyNative.semiBold,
    color: colors.status.warning,
    marginBottom: vs(spacing.xs),
    letterSpacing: 0.02,
  },
  warningText: {
    fontSize: ms(12),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    lineHeight: ms(12 * 1.5),
    letterSpacing: 0.01,
  },
});

export default SwapReviewScreen;
