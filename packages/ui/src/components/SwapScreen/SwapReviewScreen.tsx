import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, ms, vs, s } from '@salmon/shared';
import { SwapReviewCard } from './SwapReviewCard';
import { SwapDetailRow } from './SwapDetailRow';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { SwapReviewScreenProps } from './types';

const FONT_FAMILY = {
  semiBold: 'DMSansSemiBold',
} as const;

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
  const { input, output, fee, details } = quote;

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
            amount={formatAmountWithSymbol(input.amount, input.symbol)}
          />
          <SwapReviewCard
            label="You Receive"
            amount={formatAmountWithSymbol(output.amount, output.symbol)}
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
      <View style={styles.buttonsContainer}>
        <SecondaryButton
          onPress={onBack}
          disabled={isConfirming}
          style={styles.backButton}
        >
          Back
        </SecondaryButton>
        <LinearGradient
          colors={gradients.primaryButton.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={styles.confirmButtonGradient}
        >
          <PrimaryButton
            onPress={onConfirm}
            loading={isConfirming}
            disabled={isConfirming}
            style={styles.confirmButton}
          >
            Confirm
          </PrimaryButton>
        </LinearGradient>
      </View>
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
  buttonsContainer: {
    flexDirection: 'row',
    gap: s(spacing.md),
    paddingBottom: vs(spacing['2xl']),
  },
  backButton: {
    flex: 1,
    height: vs(42),
    borderWidth: 0.8,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    borderRadius: borderRadius.lg,
    backgroundColor: '#1f232f',
  },
  confirmButtonGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButton: {
    height: vs(42),
    backgroundColor: 'transparent',
  },
});

export default SwapReviewScreen;
