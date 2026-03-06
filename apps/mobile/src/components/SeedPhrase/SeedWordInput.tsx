/**
 * SeedWordInput - Input for validating a specific mnemonic word
 */
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { borderWidth, colors, spacing, componentSizes, fontSize, } from '@salmon/shared';

type ValidationState = 'idle' | 'correct' | 'incorrect';

interface SeedWordInputProps {
  /** Word position (1-indexed) */
  position: number;
  /** Current input value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Validation state */
  validationState?: ValidationState;
  /** Auto focus this input */
  autoFocus?: boolean;
  /** Called when user submits */
  onSubmitEditing?: () => void;
}

export function SeedWordInput({
  position,
  value,
  onChangeText,
  validationState = 'idle',
  autoFocus,
  onSubmitEditing,
}: SeedWordInputProps) {
  const getBorderColor = () => {
    switch (validationState) {
      case 'correct': return colors.status.success;
      case 'incorrect': return colors.status.error;
      default: return colors.input.border;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Word #{position}</Text>
      <TextInput
        style={[styles.input, { borderColor: getBorderColor() }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter word #${position}`}
        placeholderTextColor={colors.text.tertiary}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.text.secondary,
    fontFamily: 'DMSansMedium',
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    height: componentSizes.inputHeight,
    backgroundColor: colors.input.background,
    borderWidth: borderWidth.thin,
    borderRadius: componentSizes.inputRadius,
    paddingHorizontal: spacing.lg,
    color: colors.text.primary,
    fontFamily: 'DMSansRegular',
    fontSize: fontSize.md,
  },
});
