import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetRegistryForTests,
  getRegistryVersion,
  isHostTrusted,
  listTrustedHosts,
  loadTrustedHostsRegistry,
} from '../registry';
import { initStorage, resetStorage } from '../../../storage';

const FALLBACK = ['actions.dialect.to', 'dial.to', 'solana.dial.to'];

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

function fetchOk(body: { version: string; hosts: string[] }, calls: { count: number }) {
  return vi.fn(async () => {
    calls.count += 1;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

describe('blinks registry', () => {
  let adapter: ReturnType<typeof makeMemoryAdapter>;

  beforeEach(() => {
    __resetRegistryForTests();
    adapter = makeMemoryAdapter();
    initStorage({ platform: 'web', adapter });
  });

  afterEach(() => {
    resetStorage();
    __resetRegistryForTests();
    vi.useRealTimers();
  });

  describe('fallback (no load)', () => {
    it('listTrustedHosts returns the fallback set sorted', () => {
      expect(listTrustedHosts()).toEqual(FALLBACK);
    });

    it('isHostTrusted accepts hardcoded fallback hosts', () => {
      expect(isHostTrusted('dial.to')).toBe(true);
      expect(isHostTrusted('actions.dialect.to')).toBe(true);
      expect(isHostTrusted('solana.dial.to')).toBe(true);
    });

    it('getRegistryVersion is "unloaded" before any load attempt', () => {
      expect(getRegistryVersion()).toBe('unloaded');
    });
  });

  describe('loadTrustedHostsRegistry', () => {
    it('populates the cache from a successful fetch', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: '2026-05-06', hosts: ['dial.to', 'jup.ag'] }, calls);
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });

      expect(calls.count).toBe(1);
      expect(getRegistryVersion()).toBe('2026-05-06');
      expect(listTrustedHosts()).toEqual(['dial.to', 'jup.ag']);
      expect(isHostTrusted('jup.ag')).toBe(true);
      expect(isHostTrusted('actions.dialect.to')).toBe(false);
    });

    it('persists fetched data to storage', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: 'v1', hosts: ['dial.to'] }, calls);
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });

      const raw = adapter._map.get('salmon.blinks.registry.v1');
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw as string);
      expect(parsed.version).toBe('v1');
      expect(parsed.hosts).toEqual(['dial.to']);
      expect(typeof parsed.persistedAt).toBe('number');
    });

    it('dedupes concurrent loads via inflightLoad', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: 'v1', hosts: ['dial.to'] }, calls);
      await Promise.all([
        loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
        loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
        loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl }),
      ]);
      expect(calls.count).toBe(1);
    });

    it('does not refetch within the TTL', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: 'v1', hosts: ['dial.to'] }, calls);
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      expect(calls.count).toBe(1);
    });

    it('refetches when force=true even within TTL', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: 'v1', hosts: ['dial.to'] }, calls);
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl, force: true });
      expect(calls.count).toBe(2);
    });

    it('falls back to persisted cache when fetch fails', async () => {
      // Seed storage with a previous successful load.
      adapter._map.set(
        'salmon.blinks.registry.v1',
        JSON.stringify({ version: 'persisted-v', hosts: ['dial.to', 'persisted.example'], persistedAt: Date.now() }),
      );
      const fetchImpl = vi.fn(async () => {
        throw new Error('network down');
      });
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      expect(getRegistryVersion()).toBe('persisted-v');
      expect(isHostTrusted('persisted.example')).toBe(true);
    });

    it('falls back to FALLBACK_HOSTS when fetch fails AND no persisted cache', async () => {
      const fetchImpl = vi.fn(async () => {
        throw new Error('network down');
      });
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      expect(getRegistryVersion()).toBe('fallback');
      expect(listTrustedHosts()).toEqual(FALLBACK);
      expect(isHostTrusted('dial.to')).toBe(true);
    });

    it('rejects unknown hosts after fetch populates cache', async () => {
      const calls = { count: 0 };
      const fetchImpl = fetchOk({ version: 'v1', hosts: ['only.example'] }, calls);
      await loadTrustedHostsRegistry({ apiUrl: 'https://api.test', fetch: fetchImpl });
      expect(isHostTrusted('only.example')).toBe(true);
      expect(isHostTrusted('dial.to')).toBe(false); // fallback no longer applies
      expect(isHostTrusted('evil.example')).toBe(false);
    });
  });

  describe('isHostTrusted security guards (against fallback set)', () => {
    it('returns false for unknown host', () => {
      expect(isHostTrusted('evil.example')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isHostTrusted('DIAL.TO')).toBe(true);
    });

    it('rejects URLs with protocol/path', () => {
      expect(isHostTrusted('https://dial.to/foo')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isHostTrusted('')).toBe(false);
    });

    it('rejects host with port', () => {
      expect(isHostTrusted('dial.to:8080')).toBe(false);
    });

    it('rejects host with trailing path separator', () => {
      expect(isHostTrusted('dial.to/')).toBe(false);
    });

    it('rejects null-byte injection', () => {
      expect(isHostTrusted('dial.to\0evil.com')).toBe(false);
    });

    it('rejects userinfo prefix', () => {
      expect(isHostTrusted('@dial.to')).toBe(false);
    });

    it('accepts known host with leading whitespace (trimmed)', () => {
      expect(isHostTrusted(' dial.to')).toBe(true);
    });

    it('accepts known host with trailing whitespace (trimmed)', () => {
      expect(isHostTrusted('dial.to ')).toBe(true);
    });

    it('rejects IPv6 bracket literal', () => {
      expect(isHostTrusted('[::1]')).toBe(false);
    });
  });

  describe('listTrustedHosts', () => {
    it('returns hosts sorted', () => {
      const hosts = listTrustedHosts();
      const sorted = [...hosts].sort();
      expect(hosts).toEqual(sorted);
    });
  });
});
