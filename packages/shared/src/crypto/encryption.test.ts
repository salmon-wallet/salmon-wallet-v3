/**
 * Tests for Encryption module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock react-native-fast-crypto to force fallback to crypto-js
vi.mock('react-native-fast-crypto', () => ({
  pbkdf2: null, // Force fallback to crypto-js
}));

import { randomBytes } from 'tweetnacl';
import {
  deriveEncryptionKey,
  lock,
  unlock,
  isValidVault,
  IncorrectPasswordError,
  InvalidVaultError,
  KeyDerivationError,
} from './encryption';

// ============================================================================
// Test Data
// ============================================================================

const TEST_PASSWORD = 'testPassword123!';
const TEST_DATA = { secret: 'my-secret-value', key: 12345 };

// Use lower iterations for faster tests
const TEST_OPTIONS = { iterations: 1000 };

// ============================================================================
// Tests
// ============================================================================

describe('Encryption Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Error Classes
  // ==========================================================================

  describe('IncorrectPasswordError', () => {
    it('should create error with default message', () => {
      const error = new IncorrectPasswordError();
      expect(error.message).toBe('Incorrect password');
      expect(error.name).toBe('IncorrectPasswordError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof IncorrectPasswordError).toBe(true);
    });

    it('should create error with custom message', () => {
      const error = new IncorrectPasswordError('Custom password error');
      expect(error.message).toBe('Custom password error');
      expect(error.name).toBe('IncorrectPasswordError');
    });
  });

  describe('InvalidVaultError', () => {
    it('should create error with default message', () => {
      const error = new InvalidVaultError();
      expect(error.message).toBe('Invalid vault data');
      expect(error.name).toBe('InvalidVaultError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof InvalidVaultError).toBe(true);
    });

    it('should create error with custom message', () => {
      const error = new InvalidVaultError('Custom vault error');
      expect(error.message).toBe('Custom vault error');
      expect(error.name).toBe('InvalidVaultError');
    });
  });

  describe('KeyDerivationError', () => {
    it('should create error with default message', () => {
      const error = new KeyDerivationError();
      expect(error.message).toBe('Key derivation failed');
      expect(error.name).toBe('KeyDerivationError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof KeyDerivationError).toBe(true);
    });

    it('should create error with custom message', () => {
      const error = new KeyDerivationError('Custom derivation error');
      expect(error.message).toBe('Custom derivation error');
      expect(error.name).toBe('KeyDerivationError');
    });
  });

  // ==========================================================================
  // deriveEncryptionKey
  // ==========================================================================

  describe('deriveEncryptionKey', () => {
    it('should derive a valid 32-byte encryption key with valid parameters', async () => {
      const salt = randomBytes(16);
      const key = await deriveEncryptionKey(TEST_PASSWORD, salt, 1000, 'sha256');

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32); // NaCl secretbox key length
    });

    it('should derive different keys for different passwords', async () => {
      const salt = randomBytes(16);
      const key1 = await deriveEncryptionKey('password1', salt, 1000, 'sha256');
      const key2 = await deriveEncryptionKey('password2', salt, 1000, 'sha256');

      // Keys should be different for different passwords
      expect(Buffer.from(key1).toString('hex')).not.toBe(
        Buffer.from(key2).toString('hex')
      );
    });
  });

  // ==========================================================================
  // lock
  // ==========================================================================

  describe('lock', () => {
    it('should successfully encrypt data and return valid vault structure', async () => {
      const vault = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);

      expect(vault).toHaveProperty('encrypted');
      expect(vault).toHaveProperty('nonce');
      expect(vault).toHaveProperty('salt');
      expect(vault).toHaveProperty('iterations');
      expect(vault).toHaveProperty('digest');
      expect(vault).toHaveProperty('kdf');

      expect(typeof vault.encrypted).toBe('string');
      expect(typeof vault.nonce).toBe('string');
      expect(typeof vault.salt).toBe('string');
      expect(vault.iterations).toBe(1000);
      expect(vault.digest).toBe('sha512');
      expect(vault.kdf).toBe('pbkdf2');
    });

    it('should produce different ciphertexts for same data (due to random salt/nonce)', async () => {
      const vault1 = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);
      const vault2 = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);

      // Each encryption should produce different results due to random salt/nonce
      expect(vault1.encrypted).not.toBe(vault2.encrypted);
      expect(vault1.nonce).not.toBe(vault2.nonce);
      expect(vault1.salt).not.toBe(vault2.salt);
    });
  });

  // ==========================================================================
  // unlock
  // ==========================================================================

  describe('unlock', () => {
    it('should successfully decrypt data with correct password', async () => {
      const vault = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);
      const decrypted = await unlock<typeof TEST_DATA>(vault, TEST_PASSWORD);

      expect(decrypted).toEqual(TEST_DATA);
    });

    it('should throw IncorrectPasswordError with wrong password', async () => {
      const vault = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);

      await expect(unlock(vault, 'wrongPassword')).rejects.toThrow(
        IncorrectPasswordError
      );
    });
  });

  // ==========================================================================
  // isValidVault
  // ==========================================================================

  describe('isValidVault', () => {
    it('should return true for a valid vault structure', async () => {
      const vault = await lock(TEST_DATA, TEST_PASSWORD, TEST_OPTIONS);
      expect(isValidVault(vault)).toBe(true);
    });

    it('should return false for invalid vault structures', () => {
      // Test various invalid vault structures
      expect(isValidVault(null)).toBe(false);
      expect(isValidVault(undefined)).toBe(false);
      expect(isValidVault({})).toBe(false);
      expect(isValidVault({ encrypted: 'test' })).toBe(false);
      expect(
        isValidVault({
          encrypted: 'test',
          nonce: 'test',
          salt: 'test',
          iterations: 100000,
          digest: 'sha256',
          kdf: 'invalid-kdf',
        })
      ).toBe(false);
      expect(
        isValidVault({
          encrypted: 'test',
          nonce: 'test',
          salt: 'test',
          iterations: 0, // Invalid: must be > 0
          digest: 'sha256',
          kdf: 'pbkdf2',
        })
      ).toBe(false);
    });
  });
});
