/**
 * Storage module for platform-agnostic persistent and session storage.
 *
 * This module provides:
 * - **Storage**: Persistent storage with platform adapters (mobile, extension, web)
 * - **Stash**: In-memory session storage for sensitive data
 * - **Types**: Interfaces and type definitions
 *
 * @module storage
 *
 * @example
 * ```typescript
 * // Initialize storage at app startup
 * import {
 *   initStorage,
 *   initStash,
 *   createSecureStoreAdapter,
 *   getStorage,
 *   getStash,
 *   STORAGE_KEYS,
 *   STASH_KEYS,
 * } from '@salmon/shared/storage';
 *
 * // Mobile initialization
 * import * as SecureStore from 'expo-secure-store';
 *
 * initStorage({
 *   platform: 'mobile',
 *   adapter: createSecureStoreAdapter(SecureStore),
 * });
 * initStash('mobile');
 *
 * // Use storage
 * const storage = getStorage();
 * await storage.setItem(STORAGE_KEYS.VAULT, encryptedVault);
 *
 * // Use stash for sensitive session data
 * const stash = getStash();
 * await stash.setItem(STASH_KEYS.PASSWORD, userPassword);
 * ```
 */

// Types and interfaces
export type {
  StorageAdapter,
  TypedStorage,
  Stash,
  Platform,
  StorageConfig,
  StorageKey,
  StashKey,
} from './types';

export { STORAGE_KEYS, STASH_KEYS } from './types';

// Storage implementation
export {
  // Errors
  StorageError,
  StorageNotInitializedError,
  // Adapter factories
  createLocalStorageAdapter,
  createChromeStorageAdapter,
  createSecureStoreAdapter,
  createAsyncStorageAdapter,
  // Typed storage factory
  createTypedStorage,
  // Global storage management
  initStorage,
  getStorage,
  getStorageAdapter,
  getCurrentPlatform,
  isStorageInitialized,
  resetStorage,
  // Convenience functions
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
} from './storage';

// Stash implementation
export {
  // Stash factories
  createMemoryStash,
  createExtensionStash,
  createStashHandler,
  // Errors
  StashNotInitializedError,
  // Global stash management
  initStash,
  initStashWithCustom,
  getStash,
  isStashInitialized,
  resetStash,
  // Convenience functions
  getStashItem,
  setStashItem,
  removeStashItem,
  clearStash,
  // Session management helpers
  updateLastActivity,
  getLastActivity,
  isSessionTimedOut,
} from './stash';
