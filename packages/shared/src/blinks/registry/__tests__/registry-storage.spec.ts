import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  REGISTRY_STORAGE_KEY,
  clearStorage as clearRegistryStorage,
  loadFromStorage,
  saveToStorage,
} from '../registry-storage';
import { initStorage, resetStorage } from '../../../storage';

function makeMemoryAdapter() {
  const map = new Map<string, string>();
  return {
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: async (k: string) => {
      map.delete(k);
    },
    clear: async () => {
      map.clear();
    },
    _map: map,
  };
}

describe('registry-storage', () => {
  let adapter: ReturnType<typeof makeMemoryAdapter>;

  beforeEach(() => {
    adapter = makeMemoryAdapter();
    initStorage({ platform: 'web', adapter });
  });

  afterEach(() => {
    resetStorage();
  });

  it('returns null when nothing is persisted', async () => {
    expect(await loadFromStorage()).toBeNull();
  });

  it('roundtrips a valid persisted registry', async () => {
    const data = { version: 'v1', hosts: ['dial.to', 'jup.ag'], persistedAt: 1234567890 };
    await saveToStorage(data);
    expect(adapter._map.get(REGISTRY_STORAGE_KEY)).toBeDefined();
    const loaded = await loadFromStorage();
    expect(loaded).toEqual(data);
  });

  it('clears persisted data', async () => {
    await saveToStorage({ version: 'v1', hosts: ['dial.to'], persistedAt: 1 });
    await clearRegistryStorage();
    expect(adapter._map.get(REGISTRY_STORAGE_KEY)).toBeUndefined();
    expect(await loadFromStorage()).toBeNull();
  });

  it('returns null on malformed persisted shape', async () => {
    adapter._map.set(REGISTRY_STORAGE_KEY, JSON.stringify({ wrong: 'shape' }));
    expect(await loadFromStorage()).toBeNull();
  });

  it('returns null on non-string host in persisted shape', async () => {
    adapter._map.set(
      REGISTRY_STORAGE_KEY,
      JSON.stringify({ version: 'v1', hosts: ['dial.to', 42], persistedAt: 1 }),
    );
    expect(await loadFromStorage()).toBeNull();
  });

  it('returns null when storage is not initialized', async () => {
    resetStorage();
    expect(await loadFromStorage()).toBeNull();
  });

  it('saveToStorage no-ops when storage is not initialized', async () => {
    resetStorage();
    // Should not throw.
    await saveToStorage({ version: 'v1', hosts: [], persistedAt: 0 });
  });
});
