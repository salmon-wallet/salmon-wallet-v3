import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, gradients, vs, s } from '@salmon/shared';
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
