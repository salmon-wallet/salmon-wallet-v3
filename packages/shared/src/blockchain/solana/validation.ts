/**
 * Solana Validation Service
 * Migrated from salmon-wallet-v2/src/adapter/services/solana/solana-validation-service.js
 *
 * Provides validation for Solana addresses and domain names.
 * Supports both standard public keys and domain resolution via:
 * - Bonfida SNS (.sol domains)
 * - AllDomains TLD Parser (other TLDs)
 *
 * Features:
 * - Public key validation (format and on-curve check)
 * - Account existence verification
 * - Domain name resolution
 * - Comprehensive validation result codes
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getPublicKeyFromDomain } from './domains';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation result type indicating success, warning, or error
 */
export type ValidationResultType = 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * Validation result codes
 *
 * SUCCESS codes:
 * - 'valid' - Normal valid account with funds
 * - 'off_curve_no_funds' - Off-curve address (PDA) without funds
 * - 'off_curve_has_funds' - Off-curve address (PDA) with funds
 *
 * WARNING codes:
 * - 'no_info' - Valid address but account doesn't exist on-chain
 *
 * ERROR codes:
 * - 'invalid' - Invalid public key format
 * - 'same_address' - Address matches the sender (if applicable)
 * - 'invalid_domain' - Domain could not be resolved
 */
export type ValidationResultCode =
  | 'valid'
  | 'off_curve_no_funds'
  | 'off_curve_has_funds'
  | 'no_info'
  | 'invalid'
  | 'same_address'
  | 'invalid_domain';

/**
 * Address type indicator
 */
export type AddressType = 'PUBLIC_KEY' | 'DOMAIN';

/**
 * Validation result returned by validateDestinationAccount
 */
export interface ValidationResult {
  /** Result category: SUCCESS, WARNING, or ERROR */
  type: ValidationResultType;
  /** Specific result code */
  code: ValidationResultCode;
  /** Type of address that was validated (only present on success) */
  addressType?: AddressType;
  /** Resolved public key (only present when domain is resolved) */
  resolvedAddress?: string;
}

// ============================================================================
// Result Constants
// ============================================================================

const VALID_ACCOUNT: ValidationResult = {
  type: 'SUCCESS',
  code: 'valid',
  addressType: 'PUBLIC_KEY',
};

const VALID_DOMAIN: ValidationResult = {
  type: 'SUCCESS',
  code: 'valid',
  addressType: 'DOMAIN',
};

const OFF_CURVE_NO_FUNDS: ValidationResult = {
  type: 'SUCCESS',
  code: 'off_curve_no_funds',
  addressType: 'PUBLIC_KEY',
};

const OFF_CURVE_HAS_FUNDS: ValidationResult = {
  type: 'SUCCESS',
  code: 'off_curve_has_funds',
  addressType: 'PUBLIC_KEY',
};

const NO_INFO: ValidationResult = {
  type: 'WARNING',
  code: 'no_info',
};

const INVALID_ADDRESS: ValidationResult = {
  type: 'ERROR',
  code: 'invalid',
};

const INVALID_DOMAIN: ValidationResult = {
  type: 'ERROR',
  code: 'invalid_domain',
};

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Checks if a string is a valid Solana public key
 *
 * @param address - String to check
 * @returns True if the string is a valid public key
 */
function isPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if an address looks like a domain name
 *
 * @param address - String to check
 * @returns True if the address appears to be a domain
 */
function isDomainLike(address: string): boolean {
  // Domain names typically contain a dot and are not valid public keys
  return address.includes('.') && !isPublicKey(address);
}

/**
 * Validates a Solana public key address
 *
 * Performs the following checks:
 * 1. Valid public key format
 * 2. On-curve check (distinguishes regular addresses from PDAs)
 * 3. Account existence and balance check
 *
 * @param connection - Solana connection
 * @param address - Public key string to validate
 * @returns Validation result
 */
async function validatePublicKey(
  connection: Connection,
  address: string
): Promise<ValidationResult> {
  let publicKey: PublicKey;

  try {
    publicKey = new PublicKey(address);
  } catch {
    return INVALID_ADDRESS;
  }

  const isOnCurve = PublicKey.isOnCurve(publicKey);

  // Get account info to check existence and balance
  const accountInfo = await connection.getAccountInfo(publicKey);

  if (isOnCurve) {
    // Regular on-curve address
    if (accountInfo === null) {
      return NO_INFO;
    }
    if (accountInfo.lamports === 0) {
      return NO_INFO;
    }
    return VALID_ACCOUNT;
  } else {
    // Off-curve address (PDA)
    if (accountInfo === null || accountInfo.lamports === 0) {
      return OFF_CURVE_NO_FUNDS;
    }
    return OFF_CURVE_HAS_FUNDS;
  }
}

/**
 * Validates and resolves a domain name
 *
 * Uses the domain resolution functions from ./domains module which support:
 * - Bonfida SNS for .sol domains
 * - AllDomains TLD Parser for other TLDs
 *
 * @param connection - Solana connection
 * @param domain - Domain name to validate and resolve
 * @returns Validation result with resolved address if successful
 */
async function validateDomain(
  connection: Connection,
  domain: string
): Promise<ValidationResult> {
  try {
    const resolvedAddress = await getPublicKeyFromDomain(connection, domain);

    if (resolvedAddress) {
      return {
        ...VALID_DOMAIN,
        resolvedAddress,
      };
    }

    return INVALID_DOMAIN;
  } catch {
    return INVALID_DOMAIN;
  }
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Validates a destination account address
 *
 * This is the main validation function that handles both public keys and domain names.
 * It automatically detects the input type and routes to the appropriate validation.
 *
 * @param connection - Solana connection for on-chain lookups
 * @param address - Address string to validate (public key or domain)
 * @returns Validation result with type, code, and optional address info
 *
 * @example
 * ```typescript
 * // Validate a public key
 * const result = await validateDestinationAccount(connection, 'ABC123...');
 * if (result.type === 'SUCCESS') {
 *   console.log('Valid address:', result.addressType);
 * }
 *
 * // Validate a domain
 * const result = await validateDestinationAccount(connection, 'example.sol');
 * if (result.type === 'SUCCESS' && result.resolvedAddress) {
 *   console.log('Resolved to:', result.resolvedAddress);
 * }
 * ```
 */
export async function validateDestinationAccount(
  connection: Connection,
  address: string
): Promise<ValidationResult> {
  if (!address || address.trim() === '') {
    return INVALID_ADDRESS;
  }

  const trimmedAddress = address.trim();

  // Determine if input is a public key or domain
  if (isPublicKey(trimmedAddress)) {
    return validatePublicKey(connection, trimmedAddress);
  }

  if (isDomainLike(trimmedAddress)) {
    return validateDomain(connection, trimmedAddress);
  }

  // Neither a valid public key nor a domain-like string
  return INVALID_ADDRESS;
}
