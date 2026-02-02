/**
 * ScreenHeader - Common header for onboarding/auth screens
 *
 * Includes back button, optional step indicator, and spacer for alignment.
 */
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, componentSizes, contentPadding } from '@salmon/shared';
import { StepIndicator } from '../StepIndicator';

export interface ScreenHeaderProps {
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Show step indicator */
  stepIndicator?: {
    totalSteps: number;
    currentStep: number;
  };
  /** Disable back button */
  backDisabled?: boolean;
}

export function ScreenHeader({ onBack, stepIndicator, backDisabled }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={onBack}
        disabled={!onBack || backDisabled}
        style={styles.backButton}
      >
        {onBack && (
          <Ionicons
            name="chevron-back"
            size={componentSizes.iconSizeMedium}
            color={backDisabled ? colors.text.muted : colors.text.primary}
          />
        )}
      </TouchableOpacity>

      {/* Step indicator (centered) */}
      <View style={styles.center}>
        {stepIndicator && (
          <StepIndicator
            totalSteps={stepIndicator.totalSteps}
            currentStep={stepIndicator.currentStep}
          />
        )}
      </View>

      {/* Spacer for alignment */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: contentPadding.screen,
    height: componentSizes.headerHeight,
  },
  backButton: {
    width: componentSizes.backButtonSize,
    height: componentSizes.backButtonSize,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  spacer: {
    width: componentSizes.backButtonSize,
  },
});
