/**
 * useAddressValidation Hook
 * Handles address validation with debounce for the InputAddress component.
 *
 * Platform-agnostic hook that can be used by both React Native (ui)
 * and React DOM (ui-extension) InputAddress components.
 *
 * Migrated from packages/ui and packages/ui-extension where identical
 * copies lived alongside their respective InputAddress components.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  validateDestinationAccount as validateSolanaAddress,
  type ValidationResult,
} from '../blockchain/solana';
import {
  validateEthereumDestinationAccount as validateEthereumAddress,
} from '../blockchain/ethereum';

/**
 * Connection type derived from validateSolanaAddress's first parameter.
 * This avoids a direct dependency on @solana/web3.js in consumer packages.
 */
type SolanaConnection = Parameters<typeof validateSolanaAddress>[0];

/**
 * Provider type derived from validateEthereumAddress's first parameter.
 * This avoids a direct dependency on ethers in consumer packages.
 */
type EthereumProvider = Parameters<typeof validateEthereumAddress>[0];

/**
 * Union type for chain-specific connection/provider.
 * Solana uses Connection, Ethereum uses Provider, Bitcoin needs no connection.
 */
type ChainConnection = SolanaConnection | EthereumProvider | null;

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

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 500;

// Validation result code to message mapping
const VALIDATION_MESSAGES: Record<string, string> = {
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
  connection: ChainConnection,
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

  // Helper to process validation result
  const handleResult = useCallback(
    (result: ValidationResult) => {
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
    },
    [onValidation]
  );

  // Reset validation state
  const reset = useCallback(() => {
    setValidationResult(null);
    setResolvedAddress(null);
    setIsDomain(false);
    setIsValidating(false);
  }, []);

  // Validate address function — multi-chain dispatch
  const validateAddress = useCallback(
    async (addressToValidate: string) => {
      const blockchain = options.blockchain || 'solana';

      // Create new abort controller for this validation
      abortControllerRef.current = new AbortController();

      setIsValidating(true);
      setValidationResult(null);

      try {
        let result: ValidationResult;

        if (blockchain === 'solana') {
          // Solana: requires Connection
          if (!connection) { reset(); return; }
          result = await validateSolanaAddress(connection as SolanaConnection, addressToValidate);
        } else if (blockchain === 'ethereum') {
          // Ethereum: requires Provider
          if (!connection) { reset(); return; }
          const ethResult = await validateEthereumAddress(connection as EthereumProvider, addressToValidate);
          // Normalize Ethereum result to Solana ValidationResult shape
          result = {
            type: ethResult.type,
            code: ethResult.code as ValidationResult['code'],
            addressType: ethResult.addressType === 'ADDRESS' ? 'PUBLIC_KEY' : ethResult.addressType,
            resolvedAddress: ethResult.resolvedAddress,
          };
        } else if (blockchain === 'bitcoin') {
          // Bitcoin: basic format validation (no connection needed)
          const isValid = /^(1|3|bc1|tb1|2|m|n)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addressToValidate);
          result = isValid
            ? { type: 'SUCCESS', code: 'valid', addressType: 'PUBLIC_KEY' }
            : { type: 'ERROR', code: 'invalid' };
        } else {
          result = { type: 'ERROR', code: 'invalid' };
        }

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        handleResult(result);
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
    [connection, options.blockchain, onValidation, handleResult, reset]
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

export default useAddressValidation;
