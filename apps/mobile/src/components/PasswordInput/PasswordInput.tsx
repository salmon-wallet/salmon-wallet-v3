/**
 * PasswordInput - Secure text input with visibility toggle
 */
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderWidth, colors, componentSizes, spacing, fontSize, } from '@salmon/shared';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Enter password',
  error,
  editable = true,
  autoFocus,
  onSubmitEditing,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.status.error;
    if (isFocused) return colors.accent.primary;
    return colors.input.border;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, { borderColor: getBorderColor() }]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.toggleButton}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={componentSizes.iconSizeMedium}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: componentSizes.inputHeight,
    backgroundColor: colors.input.background,
    borderWidth: borderWidth.thin,
    borderRadius: componentSizes.inputRadius,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: 'DMSansRegular',
    fontSize: fontSize.md,
  },
  toggleButton: {
    padding: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
    fontFamily: 'DMSansRegular',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
