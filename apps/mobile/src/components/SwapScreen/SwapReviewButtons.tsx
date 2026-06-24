import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, shadows, vs, s, borderWidth, componentSizes, } from '@salmon/shared';
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
        testID="swap-back-button"
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
          testID="swap-confirm-button"
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
  },
  backButton: {
    flex: 1,
    height: vs(componentSizes.buttonHeightCompact),
    borderWidth: borderWidth.accent,
    borderColor: colors.accent.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.button.cancelBackground,
  },
  confirmButtonGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.accent,
    borderColor: colors.accent.border,
    ...shadows.button,
  },
  confirmButton: {
    height: vs(componentSizes.buttonHeightCompact),
    backgroundColor: 'transparent',
  },
});
