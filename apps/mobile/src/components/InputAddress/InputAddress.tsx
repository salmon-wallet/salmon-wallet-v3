/**
 * InputAddress Component
 * A text input for entering and validating blockchain addresses
 *
 * Migrated from salmon-wallet-v2/src/features/InputAddress/InputAddress.js
 *
 * Features:
 * - Address validation with debounce
 * - Visual feedback for validation states (loading, valid, invalid, warning)
 * - Domain name support with resolved address display
 * - Accessible and customizable
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { colors, useAddressValidation, useAccountsContext, isSolanaAccount, type ValidationState } from '@salmon/shared';
import type { InputAddressProps } from './types';

// ============================================================================
// Helper Components
// ============================================================================

interface ValidationIndicatorProps {
  state: ValidationState;
}

/**
 * Renders the validation state indicator (spinner, checkmark, or X)
 */
function ValidationIndicator({ state }: ValidationIndicatorProps) {
  switch (state) {
    case 'loading':
      return (
        <ActivityIndicator
          size="small"
          color={colors.palette.indigo}
          style={styles.validationIcon}
          testID="input-address-loading"
        />
      );
    case 'valid':
      return (
        <Text style={[styles.validationIcon, { color: colors.status.success, fontSize: 18 }]} testID="input-address-valid">
          {'\u2713'}
        </Text>
      );
    case 'invalid':
      return (
        <Text style={[styles.validationIcon, { color: colors.status.error, fontSize: 18 }]} testID="input-address-invalid">
          {'\u2715'}
        </Text>
      );
    case 'warning':
      return (
        <Text style={[styles.validationIcon, { color: colors.status.warning, fontSize: 18 }]} testID="input-address-warning">
          {'\u26A0'}
        </Text>
      );
    default:
      return null;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * InputAddress Component
 *
 * A specialized text input for entering blockchain addresses with built-in validation.
 * Supports Solana addresses and domain names (.sol, etc.)
 *
 * @example
 * ```tsx
 * const [address, setAddress] = useState('');
 *
 * <InputAddress
 *   address={address}
 *   onChange={setAddress}
 *   onValidation={(result) => {
 *     if (result.isValid) {
 *       console.log('Valid address:', result.resolvedAddress || address);
 *     }
 *   }}
 *   placeholder="Enter recipient address"
 *   blockchain="solana"
 * />
 * ```
 */
export function InputAddress({
  address,
  onChange,
  onValidation,
  placeholder = 'Enter address or domain',
  blockchain = 'solana',
  label,
  disabled = false,
  errorMessage,
  testID = 'input-address',
  ...textInputProps
}: InputAddressProps) {
  const [state] = useAccountsContext();
  const { activeBlockchainAccount } = state;

  // Resolve chain-specific connection/provider from the active account
  const [connection, setConnection] = useState<Parameters<typeof useAddressValidation>[1]>(null);

  useEffect(() => {
    let cancelled = false;
    const resolveConnection = async () => {
      if (!activeBlockchainAccount) return;
      try {
        if (blockchain === 'ethereum' && 'getProvider' in activeBlockchainAccount) {
          const provider = await (activeBlockchainAccount as { getProvider: () => Promise<NonNullable<typeof connection>> }).getProvider();
          if (!cancelled) setConnection(provider);
        } else if (blockchain === 'solana' && isSolanaAccount(activeBlockchainAccount)) {
          const conn = await activeBlockchainAccount.getConnection();
          if (!cancelled) setConnection(conn);
        }
        // Bitcoin: no connection needed, stays null
      } catch (err) {
        console.error('Failed to resolve chain connection:', err);
      }
    };
    resolveConnection();
    return () => { cancelled = true; };
  }, [activeBlockchainAccount, blockchain]);

  // Use validation hook
  const {
    validationState,
    isValidating,
    message,
    messageType,
    resolvedAddress,
    isDomain,
  } = useAddressValidation(address, connection, {
    debounceMs: 500,
    blockchain,
    onValidation,
  });

  // Handle text change
  const handleChangeText = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange]
  );

  // Determine container style based on validation state
  const getContainerStyle = (): ViewStyle[] => {
    const containerStyles: ViewStyle[] = [styles.inputContainer];

    if (disabled) {
      containerStyles.push(styles.inputContainerDisabled);
    }

    if (errorMessage) {
      containerStyles.push(styles.inputContainerInvalid);
      return containerStyles;
    }

    switch (validationState) {
      case 'valid':
        containerStyles.push(styles.inputContainerValid);
        break;
      case 'invalid':
        containerStyles.push(styles.inputContainerInvalid);
        break;
      case 'warning':
        containerStyles.push(styles.inputContainerWarning);
        break;
    }

    return containerStyles;
  };

  // Determine message to display
  const displayMessage = errorMessage || message;
  const displayMessageType = errorMessage ? 'error' : messageType;

  return (
    <View style={styles.container} testID={testID}>
      {/* Label */}
      {label && (
        <Text style={styles.label} testID={`${testID}-label`}>
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View style={getContainerStyle()}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={address}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.placeholder}
          editable={!disabled && !isValidating}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          testID={`${testID}-input`}
          {...textInputProps}
        />

        {/* Validation Indicator */}
        {address.length > 0 && (
          <ValidationIndicator state={validationState} />
        )}
      </View>

      {/* Validation Message */}
      {displayMessage && (
        <View style={styles.messageContainer} testID={`${testID}-message`}>
          <Text
            style={[
              styles.message,
              displayMessageType === 'error' && styles.messageError,
              displayMessageType === 'warning' && styles.messageWarning,
            ]}
          >
            {displayMessage}
          </Text>
        </View>
      )}

      {/* Domain Resolution Info */}
      {isDomain && resolvedAddress && (
        <View style={styles.domainInfo} testID={`${testID}-domain-info`}>
          <Text style={styles.domainLabel}>Resolved Address:</Text>
          <Text style={styles.domainValue} numberOfLines={1} ellipsizeMode="middle">
            {resolvedAddress}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.scanner.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputContainerValid: {
    borderColor: colors.input.borderSuccess,
  },
  inputContainerInvalid: {
    borderColor: colors.input.borderError,
  },
  inputContainerWarning: {
    borderColor: colors.status.warning,
  },
  inputContainerDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  inputDisabled: {
    color: colors.text.tertiary,
  },
  validationIcon: {
    marginLeft: 12,
  },
  messageContainer: {
    marginTop: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageError: {
    color: colors.status.error,
  },
  messageWarning: {
    color: colors.status.warning,
  },
  domainInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.scanner.background,
    borderRadius: 8,
  },
  domainLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  domainValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
});

export default InputAddress;
