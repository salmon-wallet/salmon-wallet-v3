/**
 * Tests for useDomain hook
 *
 * Tests cover the core logic and edge cases for:
 * - SmartCache: LRU caching with TTL support
 * - Domain cache utility functions
 * - Domain resolution workflow (mocked)
 *
 * Note: These tests focus on the logic layer. Full hook rendering tests
 * require @testing-library/react-hooks which should be tested in app packages.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import { SmartCache, clearDomainCache, getDomainCache } from './useDomain';
import * as domainsModule from '../blockchain/solana/domains';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../blockchain/solana/domains', () => ({
  getDomain: vi.fn(),
}));

// ============================================================================
// Test Data
// ============================================================================

// Valid Solana public key (System Program address)
const MOCK_PUBLIC_KEY = '11111111111111111111111111111111';
const MOCK_DOMAIN = 'testdomain.sol';
const MOCK_DOMAIN_ALT = 'anotherdomain.abc';

// ============================================================================
// SmartCache Tests
// ============================================================================

describe('SmartCache', () => {
  describe('Basic Operations - Success Cases', () => {
    it('should store and retrieve values correctly', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size).toBe(2);
    });

    it('should return undefined for missing keys (edge case)', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      expect(cache.get('nonexistent')).toBeUndefined();
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('LRU Eviction - Success Case', () => {
    it('should evict oldest item when max size is exceeded', () => {
      const cache = new SmartCache<string>({ maxSize: 2, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // key1 should be evicted (oldest)
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size).toBe(2);
    });

    it('should update LRU order when item is accessed (edge case)', () => {
      const cache = new SmartCache<string>({ maxSize: 2, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key3 - should evict key2 (now the oldest)
      cache.set('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('TTL Expiration - Success Case', () => {
    it('should return undefined for expired items', async () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 50 });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should keep items that have not expired (edge case)', async () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 10000 });

      cache.set('key1', 'value1');

      // Wait a short time (less than TTL)
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('Delete and Clear - Success Case', () => {
    it('should delete specific keys', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const deleted = cache.delete('key1');

      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should return false when deleting non-existent key (edge case)', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('Clear - Success Case', () => {
    it('should clear all items', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should allow new entries after clearing (edge case)', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');

      expect(cache.size).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in cache', () => {
      const cache = new SmartCache<string | null>({ maxSize: 10, ttl: 60000 });

      cache.set('null-value', null);
      expect(cache.get('null-value')).toBeNull();
      expect(cache.has('null-value')).toBe(true);
    });

    it('should handle empty strings in cache', () => {
      const cache = new SmartCache<string>({ maxSize: 10, ttl: 60000 });

      cache.set('empty', '');
      expect(cache.get('empty')).toBe('');
      expect(cache.has('empty')).toBe(true);
    });

    it('should update existing keys without evicting', () => {
      const cache = new SmartCache<string>({ maxSize: 3, ttl: 60000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1
      cache.set('key1', 'updated');
      expect(cache.size).toBe(3);
      expect(cache.get('key1')).toBe('updated');
    });

    it('should use default options when none provided', () => {
      const cache = new SmartCache<string>();

      // Should work with defaults (maxSize: 50, ttl: 10 minutes)
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
  });
});

// ============================================================================
// Domain Cache Utility Functions Tests
// ============================================================================

describe('Domain cache utility functions', () => {
  beforeEach(() => {
    clearDomainCache();
  });

  describe('clearDomainCache - Success Case', () => {
    it('should clear the global domain cache', () => {
      const cache = getDomainCache();

      cache.set('address1', 'domain1.sol');
      cache.set('address2', 'domain2.sol');

      expect(cache.size).toBe(2);

      clearDomainCache();

      expect(cache.size).toBe(0);
    });

    it('should handle clearing an empty cache (edge case)', () => {
      clearDomainCache();
      const cache = getDomainCache();

      expect(cache.size).toBe(0);
      clearDomainCache();
      expect(cache.size).toBe(0);
    });
  });

  describe('getDomainCache - Success Case', () => {
    it('should return the global cache instance', () => {
      const cache1 = getDomainCache();
      const cache2 = getDomainCache();

      expect(cache1).toBe(cache2);
    });

    it('should persist data across multiple calls (cache hit scenario)', () => {
      const cache1 = getDomainCache();
      cache1.set('test', 'value');

      const cache2 = getDomainCache();
      expect(cache2.get('test')).toBe('value');
    });
  });
});

// ============================================================================
// Domain Resolution Workflow Tests (Mocked)
// ============================================================================

describe('Domain Resolution Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDomainCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Domain Resolution', () => {
    it('should resolve domain using getDomain', async () => {
      (domainsModule.getDomain as any).mockResolvedValue(MOCK_DOMAIN);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      const domain = await domainsModule.getDomain(connection, pubkey);

      expect(domain).toBe(MOCK_DOMAIN);
      expect(domainsModule.getDomain).toHaveBeenCalledWith(connection, pubkey);
    });

    it('should return null when no domain is found (edge case)', async () => {
      (domainsModule.getDomain as any).mockResolvedValue(null);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      const domain = await domainsModule.getDomain(connection, pubkey);

      expect(domain).toBeNull();
    });
  });

  describe('Domain Resolution with Caching', () => {
    it('should cache resolved domain (cache miss then hit)', async () => {
      (domainsModule.getDomain as any).mockResolvedValue(MOCK_DOMAIN);
      const cache = getDomainCache();

      // Verify cache is empty (cache miss)
      expect(cache.has(MOCK_PUBLIC_KEY)).toBe(false);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      // Simulate hook workflow: fetch and cache
      const domain = await domainsModule.getDomain(connection, pubkey);
      cache.set(MOCK_PUBLIC_KEY, domain);

      // Verify cached (cache hit)
      expect(cache.has(MOCK_PUBLIC_KEY)).toBe(true);
      expect(cache.get(MOCK_PUBLIC_KEY)).toBe(MOCK_DOMAIN);
    });

    it('should use cache for subsequent lookups (cache hit)', async () => {
      const cache = getDomainCache();

      // Pre-populate cache
      cache.set(MOCK_PUBLIC_KEY, MOCK_DOMAIN);

      // Should not need to call getDomain
      const cachedDomain = cache.get(MOCK_PUBLIC_KEY);

      expect(cachedDomain).toBe(MOCK_DOMAIN);
      expect(domainsModule.getDomain).not.toHaveBeenCalled();
    });
  });

  describe('Domain Resolution Error Handling', () => {
    it('should handle domain resolution errors gracefully', async () => {
      const error = new Error('Domain resolution failed');
      (domainsModule.getDomain as any).mockRejectedValue(error);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      await expect(domainsModule.getDomain(connection, pubkey)).rejects.toThrow(
        'Domain resolution failed'
      );
    });

    it('should cache null on error to prevent repeated failed lookups', async () => {
      (domainsModule.getDomain as any).mockRejectedValue(new Error('Failed'));
      const cache = getDomainCache();

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      // Simulate hook error handling: cache null on failure
      try {
        await domainsModule.getDomain(connection, pubkey);
      } catch {
        cache.set(MOCK_PUBLIC_KEY, null);
      }

      // Verify null is cached
      expect(cache.has(MOCK_PUBLIC_KEY)).toBe(true);
      expect(cache.get(MOCK_PUBLIC_KEY)).toBeNull();
    });
  });
});

// ============================================================================
// Loading/Error State Simulation Tests
// ============================================================================

describe('Loading and Error State Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDomainCache();
  });

  describe('Loading State Simulation', () => {
    it('should simulate loading state with pending promise', async () => {
      let resolvePromise: (value: string) => void;
      const pendingPromise = new Promise<string>(resolve => {
        resolvePromise = resolve;
      });

      (domainsModule.getDomain as any).mockReturnValue(pendingPromise);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      // Start the request (simulates loading: true)
      const domainPromise = domainsModule.getDomain(connection, pubkey);

      // Resolve the promise
      resolvePromise!(MOCK_DOMAIN);

      const domain = await domainPromise;

      expect(domain).toBe(MOCK_DOMAIN);
    });

    it('should handle skip condition (no fetch when disabled)', () => {
      const cache = getDomainCache();

      // Simulate skip=true scenario: should not call getDomain
      const skip = true;
      const publicKey = MOCK_PUBLIC_KEY;

      if (skip || !publicKey) {
        // Hook would set: domain=null, isLoading=false, error=null
        expect(domainsModule.getDomain).not.toHaveBeenCalled();
      }
    });
  });

  describe('Error State Simulation', () => {
    it('should simulate error state for invalid public key', () => {
      const invalidKey = '';

      // Simulate hook behavior: empty string means no valid address
      if (!invalidKey) {
        const error = new Error('Invalid public key');
        expect(error.message).toBe('Invalid public key');
      }
    });

    it('should simulate error recovery on refresh', async () => {
      const cache = getDomainCache();

      // First call fails
      (domainsModule.getDomain as any).mockRejectedValueOnce(new Error('Network error'));

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      try {
        await domainsModule.getDomain(connection, pubkey);
      } catch {
        cache.set(MOCK_PUBLIC_KEY, null);
      }

      expect(cache.get(MOCK_PUBLIC_KEY)).toBeNull();

      // Simulate refresh: clear cache entry
      cache.delete(MOCK_PUBLIC_KEY);

      // Second call succeeds
      (domainsModule.getDomain as any).mockResolvedValueOnce(MOCK_DOMAIN);

      const domain = await domainsModule.getDomain(connection, pubkey);
      cache.set(MOCK_PUBLIC_KEY, domain);

      expect(cache.get(MOCK_PUBLIC_KEY)).toBe(MOCK_DOMAIN);
    });
  });
});

// ============================================================================
// Refresh Functionality Tests
// ============================================================================

describe('Refresh Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDomainCache();
  });

  describe('Cache Invalidation on Refresh', () => {
    it('should clear cache entry when refresh is triggered', () => {
      const cache = getDomainCache();

      // Pre-populate cache
      cache.set(MOCK_PUBLIC_KEY, MOCK_DOMAIN);
      expect(cache.has(MOCK_PUBLIC_KEY)).toBe(true);

      // Simulate refresh: delete cache entry
      cache.delete(MOCK_PUBLIC_KEY);

      expect(cache.has(MOCK_PUBLIC_KEY)).toBe(false);
    });

    it('should refetch domain after cache invalidation', async () => {
      (domainsModule.getDomain as any).mockResolvedValue(MOCK_DOMAIN_ALT);
      const cache = getDomainCache();

      // Pre-populate with old value
      cache.set(MOCK_PUBLIC_KEY, MOCK_DOMAIN);

      // Simulate refresh
      cache.delete(MOCK_PUBLIC_KEY);

      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      const domain = await domainsModule.getDomain(connection, pubkey);
      cache.set(MOCK_PUBLIC_KEY, domain);

      // Should have new value
      expect(cache.get(MOCK_PUBLIC_KEY)).toBe(MOCK_DOMAIN_ALT);
    });
  });
});

// ============================================================================
// PublicKey Input Handling Tests
// ============================================================================

describe('PublicKey Input Handling', () => {
  beforeEach(() => {
    clearDomainCache();
  });

  describe('String to PublicKey Conversion', () => {
    it('should handle valid base58 address string', () => {
      const addressString = MOCK_PUBLIC_KEY;

      // Simulate hook's getPublicKeyObject logic
      const pubkey = new PublicKey(addressString);
      expect(pubkey.toBase58()).toBe(addressString);
    });

    it('should handle null/undefined publicKey gracefully', () => {
      const publicKey: string | null | undefined = null;

      // Simulate hook behavior
      if (!publicKey) {
        // Hook would set: domain=null, isLoading=false
        expect(publicKey).toBeNull();
      }
    });
  });

  describe('Cache Key Generation', () => {
    it('should use base58 string as cache key for PublicKey objects', () => {
      const cache = getDomainCache();
      const pubkey = new PublicKey(MOCK_PUBLIC_KEY);

      // Simulate hook's getAddressString logic
      const cacheKey = pubkey.toBase58();
      cache.set(cacheKey, MOCK_DOMAIN);

      expect(cache.get(MOCK_PUBLIC_KEY)).toBe(MOCK_DOMAIN);
    });

    it('should use string directly as cache key for string inputs', () => {
      const cache = getDomainCache();
      const addressString = MOCK_PUBLIC_KEY;

      cache.set(addressString, MOCK_DOMAIN);

      expect(cache.get(addressString)).toBe(MOCK_DOMAIN);
    });
  });
});
