/**
 * Address validation utilities.
 *
 * Extracted from useAddressValidation.ts.
 *
 * @module utils/validation
 */

import type { ValidationResult, ValidationState } from '../types/validation';

/**
 * Validation result code to message mapping.
 */
export const VALIDATION_MESSAGES: Record<string, string> = {
  // Solana
  invalid: 'Invalid address format',
  invalid_domain: 'Could not resolve domain name',
  same_address: 'Cannot send to your own address',
  no_info: 'This account does not exist on-chain yet. The recipient will need to fund it.',
  off_curve_no_funds: 'This is a program-derived address without funds',
  off_curve_has_funds: 'This is a program-derived address',
  // Ethereum
  no_funds: 'This address has no ETH balance',
};

/**
 * Maps ValidationResult to ValidationState.
 */
export function getValidationState(result: ValidationResult | null, isValidating: boolean): ValidationState {
  if (isValidating) return 'loading';
  if (!result) return 'idle';

  switch (result.type) {
    case 'SUCCESS':
      return 'valid';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'invalid';
    default:
      return 'idle';
  }
}

/**
 * Gets the message type for styling.
 */
export function getMessageType(result: ValidationResult | null): 'error' | 'warning' | null {
  if (!result) return null;
  if (result.type === 'ERROR') return 'error';
  if (result.type === 'WARNING') return 'warning';
  return null;
}
