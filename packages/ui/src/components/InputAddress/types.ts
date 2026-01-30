/**
 * InputAddress Types
 * Migrated from salmon-wallet-v2/src/features/InputAddress/InputAddress.js
 */

import type { TextInputProps } from 'react-native';
import type {
  ValidationResult,
  ValidationResultType,
} from '@salmon/shared';

/**
 * Supported blockchain types for address validation
 */
export type BlockchainType = 'solana' | 'ethereum' | 'bitcoin';

/**
 * Validation state for the input address
 */
export type ValidationState = 'idle' | 'loading' | 'valid' | 'invalid' | 'warning';

/**
 * Validation callback result passed to onValidation
 */
export interface ValidationCallbackResult {
  /** Whether the address is valid */
  isValid: boolean;
  /** The validation state */
  state: ValidationState;
  /** The full validation result from the blockchain service */
  result: ValidationResult | null;
  /** Resolved public key (for domain addresses) */
  resolvedAddress?: string;
  /** Whether the input is a domain name */
  isDomain?: boolean;
}

/**
 * Props for the InputAddress component
 */
export interface InputAddressProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange'> {
  /** Current address value */
  address: string;
  /** Callback when address changes */
  onChange: (address: string) => void;
  /** Callback when validation completes */
  onValidation?: (result: ValidationCallbackResult) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Blockchain type for validation context */
  blockchain?: BlockchainType;
  /** Label to show above input (e.g., "To") */
  label?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Return type for useAddressValidation hook
 */
export interface UseAddressValidationReturn {
  /** Current validation state */
  validationState: ValidationState;
  /** Full validation result */
  validationResult: ValidationResult | null;
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Whether the address is valid */
  isValid: boolean;
  /** Resolved public key (for domains) */
  resolvedAddress: string | null;
  /** Whether the input is a domain */
  isDomain: boolean;
  /** Error/warning message for display */
  message: string | null;
  /** Message type (error or warning) */
  messageType: 'error' | 'warning' | null;
}

/**
 * Options for useAddressValidation hook
 */
export interface UseAddressValidationOptions {
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Blockchain type for validation */
  blockchain?: BlockchainType;
  /** Callback when validation completes */
  onValidation?: (result: ValidationCallbackResult) => void;
}
