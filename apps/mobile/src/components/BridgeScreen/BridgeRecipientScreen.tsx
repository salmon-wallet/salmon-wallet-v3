import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, componentSizes, ms, vs, s, fontFamilyNative } from '@salmon/shared';
import { RecipientAddressInput } from './RecipientAddressInput';
import { PrimaryButton, SecondaryButton } from '../Button';
import type { BridgeRecipientScreenProps } from './types';

/**
 * BridgeRecipientScreen - Second step of bridge flow
 * Allows user to enter the recipient address for the destination chain
 */
export const BridgeRecipientScreen: React.FC<BridgeRecipientScreenProps> = ({
  recipientAddress,
  onAddressChange,
  targetChain,
  onBack,
  onContinue,
  isValidAddress,
  addressError,
  style,
}) => {
  const { t } = useTranslation();
  const canContinue = isValidAddress && recipientAddress.length > 0;

  return (
    <View style={[styles.container, style]}>
      {/* Title */}
      <Text style={styles.title}>{t('bridge.recipient.title', 'Recipient Address')}</Text>

      {/* Description */}
      <Text style={styles.description}>
        {t('bridge.recipient.description', 'Enter the address where you want to receive your swapped tokens')}
        {targetChain ? ` on ${targetChain.name}` : ''}.
      </Text>

      {/* Address Input */}
      <View style={styles.inputContainer}>
        <RecipientAddressInput
          value={recipientAddress}
          onChangeValue={onAddressChange}
          targetChain={targetChain}
          label={t('bridge.recipient.destinationAddress', 'Destination Address')}
          placeholder={t('bridge.recipient.enterRecipientAddress', 'Enter recipient address')}
          error={addressError}
        />
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{t('bridge.recipient.important', 'Important')}</Text>
        <Text style={styles.infoText}>
          {t('bridge.recipient.importantText', 'Make sure the address is correct. Cross-chain transactions cannot be reversed once initiated.')}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <SecondaryButton
          onPress={onBack}
          style={styles.backButton}
        >
          {t('actions.back', 'Back')}
        </SecondaryButton>
        <LinearGradient
          colors={canContinue ? gradients.primaryButton.colors : gradients.disabled.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={[
            styles.continueButtonGradient,
            canContinue && styles.continueButtonGradientActive,
          ]}
        >
          <PrimaryButton
            onPress={onContinue}
            disabled={!canContinue}
            style={styles.continueButton}
          >
            {t('bridge.recipient.review', 'Review')}
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
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.24,
    lineHeight: ms(24 * 1.3),
    marginBottom: vs(spacing.md),
  },
  description: {
    fontSize: ms(14),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.02,
    lineHeight: ms(20),
    marginBottom: vs(spacing['2xl']),
  },
  inputContainer: {
    marginBottom: vs(spacing['2xl']),
  },
  infoBox: {
    backgroundColor: colors.background.tokenItem,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: s(spacing.base),
    marginBottom: vs(spacing['2xl']),
  },
  infoTitle: {
    fontSize: ms(13),
    fontFamily: fontFamilyNative.bold,
    color: colors.status.warning,
    marginBottom: vs(spacing.xs),
    letterSpacing: 0.02,
  },
  infoText: {
    fontSize: ms(12),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
    letterSpacing: 0.018,
    lineHeight: ms(18),
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: s(spacing.md),
    position: 'absolute',
    bottom: vs(componentSizes.tabBarHeight + spacing.xl),
    left: s(spacing.headerPadding),
    right: s(spacing.headerPadding),
  },
  backButton: {
    flex: 1,
    height: vs(42),
    borderWidth: 0.8,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    borderRadius: borderRadius.lg,
    backgroundColor: '#1f232f',
  },
  continueButtonGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 0.8,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradientActive: {
    borderColor: 'rgba(255, 92, 69, 0.8)',
  },
  continueButton: {
    height: vs(42),
    backgroundColor: 'transparent',
  },
});

export default BridgeRecipientScreen;
