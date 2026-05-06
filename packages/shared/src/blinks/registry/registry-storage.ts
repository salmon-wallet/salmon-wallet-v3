/**
 * Persistent storage for the blinks trusted-host registry.
 *
 * Thin wrapper over the shared storage abstraction (`@salmon/shared/storage`)
 * which already routes to the right per-platform adapter (AsyncStorage on
 * mobile, localStorage on web, chrome.storage on extension).
 *
 * All operations swallow errors and return safe defaults so a storage
 * outage never blocks the registry loader from falling through to the
 * hardcoded safety net.
 */

import {
  getStorageItem,
  isStorageInitialized,
  removeStorageItem,
  setStorageItem,
} from '../../storage';

export const REGISTRY_STORAGE_KEY = 'salmon.blinks.registry.v1';

export interface PersistedRegistry {
  version: string;
  hosts: string[];
  persistedAt: number;
}

function isPersistedRegistry(value: unknown): value is PersistedRegistry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'string') return false;
  if (typeof v.persistedAt !== 'number') return false;
  if (!Array.isArray(v.hosts)) return false;
  return v.hosts.every((h) => typeof h === 'string');
}

export async function loadFromStorage(): Promise<PersistedRegistry | null> {
  if (!isStorageInitialized()) return null;
  try {
    const raw = await getStorageItem<unknown>(REGISTRY_STORAGE_KEY);
    if (raw === null) return null;
    if (!isPersistedRegistry(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function saveToStorage(data: PersistedRegistry): Promise<void> {
  if (!isStorageInitialized()) return;
  try {
    await setStorageItem(REGISTRY_STORAGE_KEY, data);
  } catch {
    // Storage write failure is non-fatal — runtime cache still serves callers.
  }
}

export async function clearStorage(): Promise<void> {
  if (!isStorageInitialized()) return;
  try {
    await removeStorageItem(REGISTRY_STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}
