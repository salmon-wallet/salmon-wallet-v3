import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, ms, vs, s, formatAmountWithSymbol, getShortAddress } from '@salmon/shared';
import { SwapDetailRow } from '../SwapScreen/SwapDetailRow';
import { SwapReviewCard } from '../SwapScreen/SwapReviewCard';
import { SwapReviewButtons } from '../SwapScreen/SwapReviewButtons';
import type { BridgeReviewScreenProps } from './types';

const FONT_FAMILY = {
  medium: 'DMSansMedium',
  semiBold: 'DMSansSemiBold',
} as const;

/**
 * BridgeReviewScreen - Third step of bridge flow
 * Shows bridge details and confirm/back buttons
 * Reuses SwapDetailRow and SwapReviewCard components from SwapScreen
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
    <View style={[styles.container, style]}>
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
            amount={formatAmountWithSymbol(inAmount, inToken.symbol)}
          />
          <SwapReviewCard
            label="You Receive (estimated)"
            amount={formatAmountWithSymbol(outAmount, outToken.symbol)}
          />
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
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
                value={formatAmountWithSymbol(estimate.minAmount, inToken.symbol)}
              />
              <SwapDetailRow
                label="Estimated Output"
                value={formatAmountWithSymbol(estimate.estimatedAmount, outToken.symbol)}
              />
            </>
          )}
          <SwapDetailRow
            label="Provider"
            value="StealthEX"
          />
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Please Note</Text>
          <Text style={styles.warningText}>
            Cross-chain swaps typically take 10-30 minutes to complete. You will receive a deposit address after confirmation.
          </Text>
        </View>
      </ScrollView>

      {/* Buttons */}
      <SwapReviewButtons
        onBack={onBack}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        confirmLabel="Confirm Swap"
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
    marginBottom: vs(spacing['2xl']),
  },
  warningBox: {
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    padding: s(spacing.base),
    marginBottom: vs(spacing.lg),
  },
  warningTitle: {
    fontSize: ms(13),
    fontFamily: FONT_FAMILY.semiBold,
    color: colors.status.warning,
    marginBottom: vs(spacing.xs),
    letterSpacing: 0.02,
  },
  warningText: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
    letterSpacing: 0.018,
    lineHeight: ms(18),
  },
});

export default BridgeReviewScreen;
