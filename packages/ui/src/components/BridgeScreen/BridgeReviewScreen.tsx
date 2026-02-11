import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, ms, vs, s, formatAmountWithSymbol, getShortAddress } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';
import { SwapDetailRow } from '../SwapScreen/SwapDetailRow';
import { SwapReviewCard } from '../SwapScreen/SwapReviewCard';
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
            Confirm Swap
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

export default BridgeReviewScreen;
