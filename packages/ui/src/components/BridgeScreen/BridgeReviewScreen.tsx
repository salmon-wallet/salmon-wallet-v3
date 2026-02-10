import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, borderWidth, gradients, ms, vs, s, formatAmountWithSymbol, getShortAddress } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { BridgeReviewScreenProps } from './types';

const FONT_FAMILY = {
  medium: 'DMSansMedium',
  semiBold: 'DMSansSemiBold',
  extraBold: 'DMSansExtraBold',
} as const;

/**
 * BridgeDetailRow - A single row in the bridge details section
 * Reuses SwapDetailRow styling
 */
const BridgeDetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={detailRowStyles.container}>
    <BlurView intensity={5} tint="dark" style={detailRowStyles.blurContent}>
      <Text style={detailRowStyles.label}>{label}</Text>
      <Text style={detailRowStyles.value}>{value}</Text>
    </BlurView>
  </View>
);

const detailRowStyles = StyleSheet.create({
  container: {
    borderWidth: borderWidth.tokenListItem,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  blurContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.sm),
    minHeight: vs(40),
  },
  label: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
  value: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
    flexShrink: 1,
    textAlign: 'right',
  },
});

/**
 * BridgeReviewCard - Card displaying token amount for review screen
 * Reuses SwapReviewCard styling
 */
const BridgeReviewCard: React.FC<{ label: string; amount: string }> = ({ label, amount }) => (
  <View style={reviewCardStyles.container}>
    <BlurView intensity={5} tint="dark" style={reviewCardStyles.blurContent}>
      <Text style={reviewCardStyles.label}>{label}</Text>
      <Text style={reviewCardStyles.amount}>{amount}</Text>
    </BlurView>
  </View>
);

const reviewCardStyles = StyleSheet.create({
  container: {
    borderWidth: borderWidth.tokenListItem,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  blurContent: {
    paddingHorizontal: s(spacing.base),
    paddingVertical: vs(spacing.sm),
    minHeight: vs(75),
    justifyContent: 'center',
  },
  label: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
    letterSpacing: -0.075,
    lineHeight: ms(15 * 1.5),
  },
  amount: {
    fontSize: ms(25),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
    letterSpacing: -0.12,
    lineHeight: ms(25),
    marginTop: vs(2),
  },
});

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
          <BridgeReviewCard
            label="You Send"
            amount={formatAmountWithSymbol(inAmount, inToken.symbol)}
          />
          <BridgeReviewCard
            label="You Receive (estimated)"
            amount={formatAmountWithSymbol(outAmount, outToken.symbol)}
          />
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
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
                value={formatAmountWithSymbol(estimate.minAmount, inToken.symbol)}
              />
              <BridgeDetailRow
                label="Estimated Output"
                value={formatAmountWithSymbol(estimate.estimatedAmount, outToken.symbol)}
              />
            </>
          )}
          <BridgeDetailRow
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
