import { randomBytes, secretbox } from 'tweetnacl';
import bs58 from 'bs58';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - react-native-fast-crypto types are declared in types/crypto-modules.d.ts
import { pbkdf2 } from 'react-native-fast-crypto';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - crypto-js types are declared in types/crypto-modules.d.ts
import CryptoJS from 'crypto-js';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Supported key derivation functions for vault encryption.
 */
export type KdfType = 'pbkdf2';

/**
 * Supported digest algorithms for PBKDF2 key derivation.
 * - SHA-256: Faster, widely supported, suitable for most use cases
 * - SHA-512: Stronger security margin, recommended for high-security applications
 */
export type DigestAlgorithm = 'sha256' | 'sha512';

/**
 * Represents an encrypted vault containing sensitive data.
 * All binary fields are encoded as base58 strings for safe storage/transmission.
 */
export interface LockedVault {
  /** The encrypted data, base58 encoded */
  encrypted: string;
  /** The nonce used for encryption, base58 encoded */
  nonce: string;
  /** The salt used for key derivation, base58 encoded */
  salt: string;
  /** Number of iterations for key derivation */
  iterations: number;
  /** The digest algorithm used for key derivation */
  digest: DigestAlgorithm;
  /** The key derivation function used */
  kdf: KdfType;
}

/**
 * Configuration options for the lock function.
 */
export interface LockOptions {
  /** Number of PBKDF2 iterations (default: 100000) */
  iterations?: number;
  /** Digest algorithm for PBKDF2 (default: 'sha256') */
  digest?: DigestAlgorithm;
}

/**
 * Error thrown when decryption fails due to an incorrect password.
 */
export class IncorrectPasswordError extends Error {
  constructor(message = 'Incorrect password') {
    super(message);
    this.name = 'IncorrectPasswordError';
    Object.setPrototypeOf(this, IncorrectPasswordError.prototype);
  }
}

/**
 * Error thrown when the locked vault data is invalid or malformed.
 */
export class InvalidVaultError extends Error {
  constructor(message = 'Invalid vault data') {
    super(message);
    this.name = 'InvalidVaultError';
    Object.setPrototypeOf(this, InvalidVaultError.prototype);
  }
}

/**
 * Error thrown when key derivation fails.
 */
export class KeyDerivationError extends Error {
  constructor(message = 'Key derivation failed') {
    super(message);
    this.name = 'KeyDerivationError';
    Object.setPrototypeOf(this, KeyDerivationError.prototype);
  }
}

// ============================================================================
// Constants
// ============================================================================

/** Default number of PBKDF2 iterations */
const DEFAULT_ITERATIONS = 100000;

/** Default digest algorithm */
const DEFAULT_DIGEST: DigestAlgorithm = 'sha256';

/** Salt length in bytes */
const SALT_LENGTH = 16;

// ============================================================================
// Key Derivation
// ============================================================================

/**
 * Derives an encryption key from a password using PBKDF2.
 *
 * Uses the react-native-fast-crypto implementation for native performance
 * on mobile devices, with a fallback to crypto-js for web environments.
 *
 * @param password - The user's password
 * @param salt - A random salt (should be at least 16 bytes)
 * @param iterations - Number of PBKDF2 iterations
 * @param digest - The hash algorithm to use ('sha256' or 'sha512')
 * @returns A Promise resolving to the derived key as a Uint8Array
 * @throws {KeyDerivationError} If key derivation fails
 *
 * @example
 * ```typescript
 * const salt = randomBytes(16);
 * const key = await deriveEncryptionKey('myPassword', salt, 100000, 'sha256');
 * ```
 */
export async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  digest: DigestAlgorithm
): Promise<Uint8Array> {
  try {
    // Try native implementation first (React Native)
    if (pbkdf2?.deriveAsync) {
      const passwordBytes = new TextEncoder().encode(password);
      const key = await pbkdf2.deriveAsync(
        passwordBytes,
        salt,
        iterations,
        secretbox.keyLength,
        digest
      );
      return new Uint8Array(key);
    }

    // Fallback to crypto-js for web environments
    return deriveFallback(password, salt, iterations, digest);
  } catch (error) {
    // If native fails, try fallback
    try {
      return deriveFallback(password, salt, iterations, digest);
    } catch {
      throw new KeyDerivationError(
        `Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Fallback key derivation using crypto-js for web environments.
 */
function deriveFallback(
  password: string,
  salt: Uint8Array,
  iterations: number,
  digest: DigestAlgorithm
): Uint8Array {
  const saltWordArray = CryptoJS.lib.WordArray.create(salt as unknown as number[]);
  const hasher = digest === 'sha512' ? CryptoJS.algo.SHA512 : CryptoJS.algo.SHA256;

  const key = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: secretbox.keyLength / 4, // CryptoJS uses 32-bit words
    iterations,
    hasher,
  });

  // Convert WordArray to Uint8Array
  const words = key.words;
  const sigBytes = key.sigBytes;
  const bytes = new Uint8Array(sigBytes);

  for (let i = 0; i < sigBytes; i++) {
    bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return bytes;
}

// ============================================================================
// Encryption & Decryption
// ============================================================================

/**
 * Encrypts data with a password using NaCl secretbox and PBKDF2 key derivation.
 *
 * The encryption process:
 * 1. Generates a random 16-byte salt
 * 2. Derives an encryption key from the password using PBKDF2
 * 3. Generates a random nonce for NaCl secretbox
 * 4. Encrypts the data using NaCl secretbox (XSalsa20-Poly1305)
 * 5. Returns all components needed for decryption
 *
 * @typeParam T - The type of data being encrypted (must be JSON-serializable)
 * @param unlocked - The data to encrypt (will be JSON serialized)
 * @param password - The password to encrypt with
 * @param options - Optional configuration for encryption
 * @returns A Promise resolving to the encrypted vault
 *
 * @example
 * ```typescript
 * const sensitiveData = { mnemonic: 'word1 word2 ...', privateKey: '...' };
 * const vault = await lock(sensitiveData, 'userPassword');
 *
 * // With custom options
 * const secureVault = await lock(sensitiveData, 'userPassword', {
 *   iterations: 200000,
 *   digest: 'sha512'
 * });
 * ```
 */
export async function lock<T>(
  unlocked: T,
  password: string,
  options: LockOptions = {}
): Promise<LockedVault> {
  const { iterations = DEFAULT_ITERATIONS, digest = DEFAULT_DIGEST } = options;

  // Generate cryptographically secure random salt
  const salt = randomBytes(SALT_LENGTH);

  // Derive encryption key from password
  const key = await deriveEncryptionKey(password, salt, iterations, digest);

  // Generate random nonce for secretbox
  const nonce = randomBytes(secretbox.nonceLength);

  // Serialize and encrypt the data
  const plaintext = Buffer.from(JSON.stringify(unlocked));
  const encrypted = secretbox(plaintext, nonce, key);

  // Return the locked vault with all components base58 encoded
  return {
    encrypted: bs58.encode(encrypted),
    nonce: bs58.encode(nonce),
    salt: bs58.encode(salt),
    iterations,
    digest,
    kdf: 'pbkdf2',
  };
}

/**
 * Decrypts a locked vault using the provided password.
 *
 * The decryption process:
 * 1. Decodes the base58-encoded components (encrypted data, nonce, salt)
 * 2. Re-derives the encryption key using the same parameters
 * 3. Decrypts using NaCl secretbox
 * 4. Parses and returns the JSON data
 *
 * @typeParam T - The expected type of the decrypted data
 * @param locked - The encrypted vault to decrypt
 * @param password - The password to decrypt with
 * @returns A Promise resolving to the decrypted data
 * @throws {InvalidVaultError} If the vault structure is invalid
 * @throws {IncorrectPasswordError} If the password is incorrect
 *
 * @example
 * ```typescript
 * interface WalletData {
 *   mnemonic: string;
 *   privateKey: string;
 * }
 *
 * try {
 *   const data = await unlock<WalletData>(vault, 'userPassword');
 *   console.log(data.mnemonic);
 * } catch (error) {
 *   if (error instanceof IncorrectPasswordError) {
 *     console.error('Wrong password!');
 *   }
 * }
 * ```
 */
export async function unlock<T>(locked: LockedVault, password: string): Promise<T> {
  // Validate vault structure
  if (
    !locked ||
    typeof locked.encrypted !== 'string' ||
    typeof locked.nonce !== 'string' ||
    typeof locked.salt !== 'string' ||
    typeof locked.iterations !== 'number' ||
    typeof locked.digest !== 'string'
  ) {
    throw new InvalidVaultError('Vault is missing required fields');
  }

  // Validate digest algorithm
  if (locked.digest !== 'sha256' && locked.digest !== 'sha512') {
    throw new InvalidVaultError(`Unsupported digest algorithm: ${locked.digest}`);
  }

  try {
    // Decode base58-encoded components
    const encrypted = bs58.decode(locked.encrypted);
    const nonce = bs58.decode(locked.nonce);
    const salt = bs58.decode(locked.salt);

    // Re-derive the encryption key
    const key = await deriveEncryptionKey(password, salt, locked.iterations, locked.digest);

    // Decrypt the data
    const plaintext = secretbox.open(encrypted, nonce, key);

    if (!plaintext) {
      throw new IncorrectPasswordError();
    }

    // Parse and return the decrypted JSON
    const decodedPlaintext = Buffer.from(plaintext).toString('utf-8');
    return JSON.parse(decodedPlaintext) as T;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof IncorrectPasswordError || error instanceof InvalidVaultError) {
      throw error;
    }

    // Handle base58 decode errors
    if (error instanceof Error && error.message.includes('decode')) {
      throw new InvalidVaultError('Failed to decode vault data: invalid base58 encoding');
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      throw new InvalidVaultError('Failed to parse decrypted data: invalid JSON');
    }

    // Unknown error
    throw new IncorrectPasswordError(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates a LockedVault structure without attempting decryption.
 *
 * @param vault - The vault object to validate
 * @returns true if the vault structure is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidVault(storedVault)) {
 *   const data = await unlock(storedVault, password);
 * }
 * ```
 */
export function isValidVault(vault: unknown): vault is LockedVault {
  if (!vault || typeof vault !== 'object') {
    return false;
  }

  const v = vault as Record<string, unknown>;

  return (
    typeof v.encrypted === 'string' &&
    typeof v.nonce === 'string' &&
    typeof v.salt === 'string' &&
    typeof v.iterations === 'number' &&
    v.iterations > 0 &&
    (v.digest === 'sha256' || v.digest === 'sha512') &&
    v.kdf === 'pbkdf2'
  );
}
