/**
 * useAddressValidation Hook
 * Handles address validation with debounce for the InputAddress component
 *
 * Migrated from salmon-wallet-v2/src/features/InputAddress/InputAddress.js
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Connection } from '@solana/web3.js';
import {
  validateDestinationAccount,
  type ValidationResult,
} from '@salmon/shared';
import type {
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from './types';

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 500;

// Validation result code to message mapping
const VALIDATION_MESSAGES: Record<string, string> = {
  invalid: 'Invalid address format',
  invalid_domain: 'Could not resolve domain name',
  same_address: 'Cannot send to your own address',
  no_info: 'This account does not exist on-chain yet. The recipient will need to fund it.',
  off_curve_no_funds: 'This is a program-derived address without funds',
  off_curve_has_funds: 'This is a program-derived address',
};

/**
 * Maps ValidationResult to ValidationState
 */
function getValidationState(result: ValidationResult | null, isValidating: boolean): ValidationState {
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
 * Gets the message type for styling
 */
function getMessageType(result: ValidationResult | null): 'error' | 'warning' | null {
  if (!result) return null;
  if (result.type === 'ERROR') return 'error';
  if (result.type === 'WARNING') return 'warning';
  return null;
}

/**
 * Hook for validating addresses with debounce
 *
 * @param address - The address string to validate
 * @param connection - Solana connection instance
 * @param options - Configuration options
 * @returns Validation state and results
 *
 * @example
 * ```tsx
 * const {
 *   validationState,
 *   isValid,
 *   message,
 *   messageType,
 * } = useAddressValidation(address, connection, {
 *   debounceMs: 500,
 *   onValidation: (result) => console.log('Validated:', result),
 * });
 * ```
 */
export function useAddressValidation(
  address: string,
  connection: Connection | null,
  options: UseAddressValidationOptions = {}
): UseAddressValidationReturn {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onValidation,
  } = options;

  // State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isDomain, setIsDomain] = useState(false);

  // Refs for cleanup and debounce
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Validate address function
  const validateAddress = useCallback(
    async (addressToValidate: string) => {
      if (!connection) {
        setValidationResult(null);
        setResolvedAddress(null);
        setIsDomain(false);
        return;
      }

      // Create new abort controller for this validation
      abortControllerRef.current = new AbortController();

      setIsValidating(true);
      setValidationResult(null);

      try {
        const result = await validateDestinationAccount(connection, addressToValidate);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setValidationResult(result);
        setIsValidating(false);

        // Handle domain resolution
        const isAddressDomain = result.addressType === 'DOMAIN';
        setIsDomain(isAddressDomain);
        setResolvedAddress(result.resolvedAddress || null);

        // Call onValidation callback
        if (onValidation) {
          const callbackResult: ValidationCallbackResult = {
            isValid: result.type === 'SUCCESS' || result.type === 'WARNING',
            state: getValidationState(result, false),
            result,
            resolvedAddress: result.resolvedAddress,
            isDomain: isAddressDomain,
          };
          onValidation(callbackResult);
        }
      } catch (error) {
        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        console.error('Address validation error:', error);
        setIsValidating(false);

        const errorResult: ValidationResult = {
          type: 'ERROR',
          code: 'invalid',
        };
        setValidationResult(errorResult);
        setResolvedAddress(null);
        setIsDomain(false);

        if (onValidation) {
          onValidation({
            isValid: false,
            state: 'invalid',
            result: errorResult,
          });
        }
      }
    },
    [connection, onValidation]
  );

  // Effect to handle address changes with debounce
  useEffect(() => {
    // Cleanup previous validation
    cleanup();

    // Reset state if address is empty
    if (!address || address.trim() === '') {
      setValidationResult(null);
      setResolvedAddress(null);
      setIsDomain(false);
      setIsValidating(false);

      if (onValidation) {
        onValidation({
          isValid: false,
          state: 'idle',
          result: null,
        });
      }
      return;
    }

    // Set up debounced validation
    debounceTimerRef.current = setTimeout(() => {
      validateAddress(address);
    }, debounceMs);

    // Cleanup on unmount or address change
    return cleanup;
  }, [address, debounceMs, validateAddress, cleanup, onValidation]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Computed values
  const validationState = useMemo(
    () => getValidationState(validationResult, isValidating),
    [validationResult, isValidating]
  );

  const isValid = useMemo(
    () => validationResult?.type === 'SUCCESS' || validationResult?.type === 'WARNING',
    [validationResult]
  );

  const message = useMemo(() => {
    if (!validationResult || validationResult.type === 'SUCCESS') {
      return null;
    }
    return VALIDATION_MESSAGES[validationResult.code] || 'Unknown validation error';
  }, [validationResult]);

  const messageType = useMemo(
    () => getMessageType(validationResult),
    [validationResult]
  );

  return {
    validationState,
    validationResult,
    isValidating,
    isValid,
    resolvedAddress,
    isDomain,
    message,
    messageType,
  };
}
