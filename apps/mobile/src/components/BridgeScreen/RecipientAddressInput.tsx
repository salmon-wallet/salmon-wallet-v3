import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  ms,
  vs,
  s,
  fontFamilyNative,
  useAddressValidation,
} from '@salmon/shared';
import type { BlockchainType } from '@salmon/shared';
import type { RecipientAddressInputProps } from './types';

/**
 * RecipientAddressInput - Input field for bridge recipient address
 * Displays the destination address with validation feedback.
 * Integrates useAddressValidation for debounced address validation.
 */
export const RecipientAddressInput: React.FC<RecipientAddressInputProps> = ({
  value,
  onChangeValue,
  targetChain,
  label = 'Recipient Address',
  placeholder = 'Enter destination address',
  style,
  error,
  onValidation,
}) => {
  // Derive blockchain type from targetChain id
  const blockchain = useMemo<BlockchainType | undefined>(() => {
    if (!targetChain) return undefined;
    const id = targetChain.id.toLowerCase();
    if (id === 'solana' || id === 'ethereum' || id === 'bitcoin') {
      return id as BlockchainType;
    }
    return undefined;
  }, [targetChain]);

  // Address validation hook (connection is null until context is wired up)
  const {
    validationState,
    isValidating,
    message: validationMessage,
  } = useAddressValidation(value, null, {
    debounceMs: 500,
    blockchain,
    onValidation: onValidation
      ? (result) => onValidation({ isValid: result.isValid, message: null })
      : undefined,
  });

  const handleChangeText = useCallback(
    (text: string) => {
      // Trim whitespace but allow the user to paste addresses
      const trimmed = text.trim();
      onChangeValue(trimmed);
    },
    [onChangeValue]
  );

  // Determine which error/message to show (external error takes precedence)
  const displayMessage = error || validationMessage;
  const hasError = !!error || validationState === 'invalid';
  const hasWarning = !error && validationState === 'warning';
  const hasValue = value.length > 0;

  // Input container border style based on validation state
  const inputContainerStyle = useMemo(() => {
    if (hasError) return styles.inputContainerError;
    if (hasWarning) return styles.inputContainerWarning;
    if (hasValue && validationState === 'valid') return styles.inputContainerValid;
    return undefined;
  }, [hasError, hasWarning, hasValue, validationState]);

  return (
    <View style={[styles.container, style]}>
      {/* Label with chain hint */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {targetChain && (
          <Text style={styles.chainHint}>
            ({targetChain.name} address)
          </Text>
        )}
      </View>

      {/* Input */}
      <View style={[styles.inputContainer, inputContainerStyle]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          multiline={false}
        />
        {/* Validation indicator */}
        {hasValue && isValidating && (
          <ActivityIndicator
            size="small"
            color={colors.text.secondary}
            style={styles.validationIndicator}
          />
        )}
        {hasValue && !isValidating && validationState === 'valid' && (
          <Text style={[styles.validationIndicator, styles.validIcon]}>{'\u2713'}</Text>
        )}
        {hasValue && !isValidating && validationState === 'invalid' && (
          <Text style={[styles.validationIndicator, styles.invalidIcon]}>{'\u2715'}</Text>
        )}
        {hasValue && !isValidating && validationState === 'warning' && (
          <Text style={[styles.validationIndicator, styles.warningIcon]}>{'\u26A0'}</Text>
        )}
      </View>

      {/* Validation / Error Message */}
      {displayMessage && (
        <Text style={[
          styles.messageText,
          hasError && styles.errorText,
          hasWarning && styles.warningText,
        ]}>
          {displayMessage}
        </Text>
      )}

      {/* Helper Text (only when no errors/warnings) */}
      {!displayMessage && targetChain && (
        <Text style={styles.helperText}>
          Enter the {targetChain.name} address where you want to receive your {targetChain.symbol}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: vs(spacing.sm),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.xs),
  },
  label: {
    fontSize: ms(14),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    letterSpacing: 0.02,
    lineHeight: ms(18),
  },
  chainHint: {
    fontSize: ms(12),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
    letterSpacing: 0.018,
    lineHeight: ms(16),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: borderWidth.tokenListItem,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    minHeight: vs(58),
    paddingHorizontal: s(spacing.md),
    paddingVertical: vs(spacing.sm),
  },
  inputContainerError: {
    borderColor: colors.status.error,
  },
  inputContainerWarning: {
    borderColor: colors.status.warning,
  },
  inputContainerValid: {
    borderColor: colors.status.success,
  },
  input: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  validationIndicator: {
    marginLeft: s(spacing.sm),
  },
  validIcon: {
    fontSize: ms(18),
    color: colors.status.success,
  },
  invalidIcon: {
    fontSize: ms(18),
    color: colors.status.error,
  },
  warningIcon: {
    fontSize: ms(18),
    color: colors.status.warning,
  },
  messageText: {
    fontSize: ms(12),
    fontFamily: fontFamilyNative.regular,
    letterSpacing: 0.018,
    lineHeight: ms(16),
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.status.error,
  },
  warningText: {
    color: colors.status.warning,
  },
  helperText: {
    fontSize: ms(11),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
    letterSpacing: 0.018,
    lineHeight: ms(16),
  },
});

export default RecipientAddressInput;
