import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, shadows, vs, s } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';

export interface SwapReviewButtonsProps {
  onBack: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  confirmLabel?: string;
  style?: object;
}

/**
 * SwapReviewButtons - Shared Back/Confirm buttons for review screens
 * Used by SwapReviewScreen and BridgeReviewScreen
 */
export const SwapReviewButtons: React.FC<SwapReviewButtonsProps> = ({
  onBack,
  onConfirm,
  isConfirming = false,
  confirmLabel = 'Confirm',
  style,
}) => {
  return (
    <View style={[styles.buttonsContainer, style]}>
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
          {confirmLabel}
        </PrimaryButton>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    gap: s(spacing.md),
    paddingBottom: vs(spacing['2xl']),
  },
  backButton: {
    flex: 1,
    height: vs(42),
    borderWidth: 0.8,
    borderColor: colors.accent.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.button.cancelBackground,
  },
  confirmButtonGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 0.8,
    borderColor: colors.accent.border,
    ...shadows.button,
  },
  confirmButton: {
    height: vs(42),
    backgroundColor: 'transparent',
  },
});
