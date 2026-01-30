/**
 * Memory Cache with Request Deduplication
 *
 * Implements promise deduplication to prevent duplicate concurrent requests.
 * Following best practices for React client-side caching.
 *
 * @module cache
 */

/** Default cache expiration time in milliseconds (60 seconds) */
const DEFAULT_EXPIRES_MS = 60 * 1000;

/**
 * Cache types enum for type-safe cache keys
 * Each type represents a different category of cached data
 */
export const CACHE_TYPES = {
  BALANCE: 'BALANCE',
  NFTS: 'NFTS',
  NFTS_ALL: 'NFTS_ALL',
  NFTS_COLLECTION_DETAIL: 'NFTS_COLLECTION_DETAIL',
  NFTS_COLLECTION_ITEMS: 'NFTS_COLLECTION_ITEMS',
  NFTS_BUY_DETAIL: 'NFTS_BUY_DETAIL',
  SINGLE_NFT: 'SINGLE_NFT',
  TRANSACTIONS: 'TRANSACTIONS',
  TOKENS: 'TOKENS',
  AVAILABLE_TOKENS: 'AVAILABLE_TOKENS',
  FEATURED_TOKENS: 'FEATURED_TOKENS',
  BRIDGE_SUPPORTED: 'BRIDGE_SUPPORTED',
} as const;

/** Type representing valid cache type keys */
export type CacheType = (typeof CACHE_TYPES)[keyof typeof CACHE_TYPES];

/**
 * Structure for individual cache entries
 * @template T - The type of the cached value
 */
interface CacheEntry<T = unknown> {
  /** Expiration timestamp in milliseconds, null if not set */
  expires: number | null;
  /** Unique key identifier for this cache entry */
  key: string;
  /** The cached value */
  value: T;
}

/** Type for the cache store mapping cache types to their entries */
type CacheStore = Record<CacheType, CacheEntry>;

/**
 * Internal cache storage
 * Maintains cached values with their expiration times and keys
 */
let CACHE: CacheStore = {
  [CACHE_TYPES.BALANCE]: {
    expires: null,
    key: '',
    value: {},
  },
  [CACHE_TYPES.NFTS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.NFTS_ALL]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.NFTS_COLLECTION_DETAIL]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.NFTS_COLLECTION_ITEMS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.NFTS_BUY_DETAIL]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.SINGLE_NFT]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.TRANSACTIONS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.TOKENS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.AVAILABLE_TOKENS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.FEATURED_TOKENS]: {
    expires: null,
    key: '',
    value: [],
  },
  [CACHE_TYPES.BRIDGE_SUPPORTED]: {
    expires: null,
    key: '',
    value: [],
  },
};

/**
 * Map to store pending promises and prevent duplicate concurrent requests
 * Key format: "CACHE_TYPE-key"
 */
const pendingPromises = new Map<string, Promise<unknown>>();

/**
 * Cache with request deduplication
 *
 * When multiple components request the same data simultaneously:
 * 1. First request creates a promise and stores it in pendingPromises
 * 2. Subsequent requests reuse the same pending promise
 * 3. Once resolved, the result is cached and the promise is removed
 *
 * This prevents duplicate API calls when components mount at the same time.
 *
 * @template T - The type of the data being cached
 * @param key - Unique identifier for the cached data (e.g., "solana-123abc")
 * @param type - Cache type from CACHE_TYPES
 * @param callback - Async function that fetches the data
 * @param ttl - Optional custom TTL in milliseconds (defaults to 60 seconds)
 * @returns Promise resolving to the cached or freshly fetched data
 *
 * @example
 * ```typescript
 * const balance = await cache(
 *   `${network}-${address}`,
 *   CACHE_TYPES.BALANCE,
 *   () => fetchBalance(address)
 * );
 * ```
 */
export const cache = async <T>(
  key: string,
  type: CacheType,
  callback: () => Promise<T>,
  ttl: number = DEFAULT_EXPIRES_MS
): Promise<T> => {
  const cacheKey = `${type}-${key}`;

  // 1. Check if there's a pending promise for this exact request
  // This prevents duplicate concurrent calls
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey) as Promise<T>;
  }

  // 2. Check if we have valid cached data
  const cacheEntry = CACHE[type];
  const hasValidCache =
    cacheEntry.expires !== null &&
    cacheEntry.expires > Date.now() &&
    key === cacheEntry.key;

  if (hasValidCache) {
    return cacheEntry.value as T;
  }

  // 3. No cache and no pending promise - create a new request
  const promise = callback()
    .then((value: T) => {
      // Store the result in cache
      CACHE[type].value = value;
      CACHE[type].key = key;
      CACHE[type].expires = Date.now() + ttl;

      // Remove from pending promises
      pendingPromises.delete(cacheKey);

      return value;
    })
    .catch((error: unknown) => {
      // On error, remove from pending promises to allow retries
      pendingPromises.delete(cacheKey);
      throw error;
    });

  // Store the promise so other concurrent calls can reuse it
  pendingPromises.set(cacheKey, promise);

  return promise;
};

/**
 * Invalidate cached data for a specific type
 * Forces next cache() call to fetch fresh data
 *
 * Also clears any pending promises for this type to ensure fresh data
 * on the next request.
 *
 * @param type - Cache type from CACHE_TYPES to invalidate
 *
 * @example
 * ```typescript
 * // After a transaction, invalidate the balance cache
 * await invalidate(CACHE_TYPES.BALANCE);
 * ```
 */
export const invalidate = async (type: CacheType): Promise<void> => {
  CACHE[type].expires = null;

  // Also clear any pending promises for this type
  // to ensure fresh data on next request
  for (const [key] of pendingPromises) {
    if (key.startsWith(`${type}-`)) {
      pendingPromises.delete(key);
    }
  }
};

/**
 * Clear all cached data and pending promises
 * Useful for logout scenarios or when switching accounts
 *
 * Resets the entire cache to its initial state and clears
 * all pending request promises.
 *
 * @example
 * ```typescript
 * // On user logout
 * await clearAllCache();
 * ```
 */
export const clearAllCache = async (): Promise<void> => {
  // Reset all cache entries to initial state
  CACHE = {
    [CACHE_TYPES.BALANCE]: {
      expires: null,
      key: '',
      value: {},
    },
    [CACHE_TYPES.NFTS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.NFTS_ALL]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.NFTS_COLLECTION_DETAIL]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.NFTS_COLLECTION_ITEMS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.NFTS_BUY_DETAIL]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.SINGLE_NFT]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.TRANSACTIONS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.TOKENS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.AVAILABLE_TOKENS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.FEATURED_TOKENS]: {
      expires: null,
      key: '',
      value: [],
    },
    [CACHE_TYPES.BRIDGE_SUPPORTED]: {
      expires: null,
      key: '',
      value: [],
    },
  };

  // Clear all pending promises
  pendingPromises.clear();
};
