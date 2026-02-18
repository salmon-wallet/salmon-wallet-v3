import { borderRadius, colors, formatAmountWithSymbol, formatSolFee, ms, s, spacing, vs } from '@salmon/shared';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SwapDetailRow } from './SwapDetailRow';
import { SwapReviewCard } from './SwapReviewCard';
import { SwapReviewButtons } from './SwapReviewButtons';
import type { SwapReviewScreenProps } from './types';

const FONT_FAMILY = {
  semiBold: 'DMSansSemiBold',
} as const;

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

const formatUsd = (value: number | undefined): string | undefined =>
  value != null ? `~$${value.toFixed(2)}` : undefined;

/**
 * SwapReviewScreen - Second step of swap flow
 * Shows quote details and confirm/back buttons
 */
export const SwapReviewScreen: React.FC<SwapReviewScreenProps> = ({
  quote,
  inToken,
  outToken,
  onBack,
  onConfirm,
  isConfirming = false,
  style,
}) => {
  // Extract data from backend response structure (custom contains all swap details)
  const { input, output, fee, routeNames, custom: details } = quote;

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
            amount={formatAmountWithSymbol(Number(input.amount) / (10 ** input.decimals), input.symbol)}
            usdValue={formatUsd(details.inUsdValue)}
          />
          <SwapReviewCard
            label="You Receive"
            amount={formatAmountWithSymbol(Number(output.amount) / (10 ** output.decimals), output.symbol)}
            usdValue={formatUsd(details.outUsdValue)}
          />
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <SwapDetailRow
            label="Salmon fee"
            value={formatPercent(fee.percent)}
          />
          <SwapDetailRow
            label="Router"
            value={details.router}
          />
          {routeNames.length > 0 && (
            <SwapDetailRow
              label="Route"
              value={routeNames.join(' → ')}
            />
          )}
          {details.gasless && (
            <SwapDetailRow
              label="Gasless"
              value="Yes"
            />
          )}
          <SwapDetailRow
            label="Priority Fee"
            value={formatSolFee(details.prioritizationFeeLamports)}
          />
          <SwapDetailRow
            label="Rent Fee"
            value={formatSolFee(details.rentFeeLamports)}
          />
          <SwapDetailRow
            label="Slippage Tolerance"
            value={formatPercent(details.slippageBps / 100)}
          />
          <SwapDetailRow
            label="Minimum Received"
            value={formatAmountWithSymbol(Number(details.otherAmountThreshold) / (10 ** output.decimals), output.symbol)}
          />
          <SwapDetailRow
            label="Swap Mode"
            value={details.swapMode}
          />
        </View>

        {/* Price Impact (highlighted) */}
        <View style={styles.priceImpactContainer}>
          <SwapDetailRow
            label="Total Price Impact"
            value={formatPercent(details.priceImpact)}
          />
        </View>
      </ScrollView>

      {/* Buttons */}
      <SwapReviewButtons
        onBack={onBack}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        confirmLabel="Confirm"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: s(spacing.headerPadding),
    paddingTop: vs(spacing['2xl']),
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
    fontFamily: FONT_FAMILY.semiBold,
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
  priceImpactContainer: {
    marginBottom: vs(spacing.lg),
  },
});

export default SwapReviewScreen;
