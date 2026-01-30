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

import React, { useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import type { Connection } from '@solana/web3.js';
import { useAddressValidation } from './useAddressValidation';
import type { InputAddressProps, ValidationState } from './types';

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
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D44',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputContainerValid: {
    borderColor: '#10B981',
  },
  inputContainerInvalid: {
    borderColor: '#EF4444',
  },
  inputContainerWarning: {
    borderColor: '#F59E0B',
  },
  inputContainerDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  inputDisabled: {
    color: '#6B7280',
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
    color: '#EF4444',
  },
  messageWarning: {
    color: '#F59E0B',
  },
  domainInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
  },
  domainLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  domainValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
});

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
          color="#6366F1"
          style={styles.validationIcon}
          testID="input-address-loading"
        />
      );
    case 'valid':
      return (
        <Text style={[styles.validationIcon, { color: '#10B981', fontSize: 18 }]} testID="input-address-valid">
          ✓
        </Text>
      );
    case 'invalid':
      return (
        <Text style={[styles.validationIcon, { color: '#EF4444', fontSize: 18 }]} testID="input-address-invalid">
          ✕
        </Text>
      );
    case 'warning':
      return (
        <Text style={[styles.validationIcon, { color: '#F59E0B', fontSize: 18 }]} testID="input-address-warning">
          ⚠
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
  // TODO: Get connection from context or props
  // For now, we'll create a placeholder connection
  // In production, this should come from a blockchain context
  const connection: Connection | null = null;

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
          placeholderTextColor="#6B7280"
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

export default InputAddress;
