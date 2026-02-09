/**
 * InputAddress Types
 * Migrated from salmon-wallet-v2/src/features/InputAddress/InputAddress.js
 *
 * Hook-related types (BlockchainType, ValidationState, ValidationCallbackResult,
 * UseAddressValidationReturn, UseAddressValidationOptions) are now defined in
 * @salmon/shared and re-exported from the barrel index.ts for backwards compat.
 */

import type { TextInputProps } from 'react-native';
import type {
  BlockchainType,
  ValidationCallbackResult,
  ValidationState,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from '@salmon/shared';

// Re-export shared types so existing local imports still work
export type {
  BlockchainType,
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from '@salmon/shared';

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
