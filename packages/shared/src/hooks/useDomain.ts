/**
 * useDomain Hook
 * Migrated from salmon-wallet-v2: src/hooks/useDomain.js
 *
 * Provides domain name resolution for Solana addresses.
 * Uses SmartCache for efficient caching with TTL and LRU eviction.
 */

import { useEffect, useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getDomain } from '../blockchain/solana/domains';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for SmartCache
 */
export interface SmartCacheOptions {
  /** Maximum number of items to store in cache (default: 50) */
  maxSize?: number;
  /** Time-to-live in milliseconds (default: 10 minutes) */
  ttl?: number;
}

/**
 * Cache item with value and timestamp
 */
interface CacheItem<T> {
  value: T;
  timestamp: number;
}

/**
 * Return type for useDomain hook
 */
export interface UseDomainResult {
  /** The resolved domain name (e.g., 'mydomain.sol') or null */
  domain: string | null;
  /** Whether the domain is currently being fetched */
  isLoading: boolean;
  /** Error that occurred during domain resolution, if any */
  error: Error | null;
  /** Function to manually refresh the domain */
  refresh: () => void;
}

/**
 * Options for useDomain hook
 */
export interface UseDomainOptions {
  /** Solana RPC connection */
  connection: Connection;
  /** Public key or address string to resolve domain for */
  publicKey: PublicKey | string | null | undefined;
  /** Whether to skip fetching (useful for conditional fetching) */
  skip?: boolean;
}

// ============================================================================
// SmartCache Implementation
// ============================================================================

/**
 * SmartCache - LRU cache with TTL support
 *
 * Features:
 * - LRU (Least Recently Used) eviction when cache is full
 * - TTL (Time-To-Live) for automatic expiration
 * - Efficient O(1) operations using Map
 *
 * @template T - Type of cached values
 */
export class SmartCache<T> {
  private maxSize: number;
  private ttl: number;
  private cache: Map<string, CacheItem<T>>;

  constructor(options: SmartCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 50;
    this.ttl = options.ttl ?? 10 * 60 * 1000; // 10 minutes default
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache
   * Returns undefined if not found or expired
   * Moves accessed item to end (most recently used)
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check TTL expiration
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  /**
   * Sets a value in the cache
   * Evicts oldest item if cache is full
   */
  set(key: string, value: T): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new item
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    // Evict oldest (first) item if over max size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Checks if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the current number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Global Domain Cache
// ============================================================================

/**
 * Global cache instance for domain resolution
 * Shared across all useDomain hook instances
 */
const domainCache = new SmartCache<string | null>({
  maxSize: 50,
  ttl: 10 * 60 * 1000, // 10 minutes
});

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for resolving Solana domain names
 *
 * Resolves a public key to its associated domain name (e.g., .sol, .abc)
 * using both SPL Name Service and AllDomains with automatic fallback.
 *
 * @param options - Hook configuration options
 * @returns Object with domain, isLoading, error, and refresh function
 *
 * @example
 * ```typescript
 * // With a Connection and PublicKey
 * const { domain, isLoading, error } = useDomain({
 *   connection,
 *   publicKey: new PublicKey('...'),
 * });
 *
 * // With an address string
 * const { domain, isLoading, error } = useDomain({
 *   connection,
 *   publicKey: 'address-string',
 * });
 *
 * // Skip fetching conditionally
 * const { domain, isLoading, error } = useDomain({
 *   connection,
 *   publicKey: address,
 *   skip: !isConnected,
 * });
 * ```
 */
export function useDomain(options: UseDomainOptions): UseDomainResult {
  const { connection, publicKey, skip = false } = options;

  const [domain, setDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Convert publicKey to string for cache key
  const getAddressString = useCallback((): string | null => {
    if (!publicKey) return null;
    if (typeof publicKey === 'string') return publicKey;
    return publicKey.toBase58();
  }, [publicKey]);

  // Convert to PublicKey object for domain resolution
  const getPublicKeyObject = useCallback((): PublicKey | null => {
    if (!publicKey) return null;
    if (publicKey instanceof PublicKey) return publicKey;
    try {
      return new PublicKey(publicKey);
    } catch {
      return null;
    }
  }, [publicKey]);

  // Refresh function to manually trigger domain refetch
  const refresh = useCallback(() => {
    const address = getAddressString();
    if (address) {
      domainCache.delete(address);
    }
    setRefreshTrigger((prev: number) => prev + 1);
  }, [getAddressString]);

  useEffect(() => {
    // Skip if disabled or no public key
    if (skip || !publicKey) {
      setDomain(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const address = getAddressString();
    if (!address) {
      setDomain(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (domainCache.has(address)) {
      setDomain(domainCache.get(address) ?? null);
      setIsLoading(false);
      return;
    }

    const pubkey = getPublicKeyObject();
    if (!pubkey) {
      setDomain(null);
      setIsLoading(false);
      setError(new Error('Invalid public key'));
      return;
    }

    // Fetch domain
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    getDomain(connection, pubkey)
      .then((result) => {
        if (cancelled) return;
        setDomain(result);
        domainCache.set(address, result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error('Failed to fetch domain');
        console.error('Error fetching domain:', error);
        setError(error);
        setDomain(null);
        domainCache.set(address, null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, skip, refreshTrigger, getAddressString, getPublicKeyObject]);

  return { domain, isLoading, error, refresh };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clears the global domain cache
 * Useful for testing or when switching networks
 */
export function clearDomainCache(): void {
  domainCache.clear();
}

/**
 * Gets the domain cache instance
 * Useful for testing or advanced cache manipulation
 */
export function getDomainCache(): SmartCache<string | null> {
  return domainCache;
}

export default useDomain;
