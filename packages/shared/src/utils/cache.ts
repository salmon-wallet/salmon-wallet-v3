/**
 * SmartCache - LRU cache with TTL support
 *
 * Features:
 * - LRU (Least Recently Used) eviction when cache is full
 * - TTL (Time-To-Live) for automatic expiration
 * - Efficient O(1) operations using Map
 *
 * @module utils/cache
 */

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
 * SmartCache - LRU cache with TTL support
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
