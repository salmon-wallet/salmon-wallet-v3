/**
 * InputAddress Component
 *
 * A text input component for entering and validating blockchain addresses.
 * Supports Solana public keys and domain names with real-time validation.
 */

export { InputAddress, default } from './InputAddress';
export { useAddressValidation } from './useAddressValidation';
export type {
  InputAddressProps,
  BlockchainType,
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from './types';
