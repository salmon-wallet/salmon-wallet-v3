/**
 * Blinks trusted-host registry — runtime cache + async loader.
 *
 * Authoritative source is salmon-api (`GET /v1/blinks/registry`). The wallet
 * caches the result in memory for the session and persists it (AsyncStorage on
 * mobile, localStorage on web, chrome.storage on extension) so we trust the
 * same set offline. A hardcoded 3-host safety net is used only when there is
 * no cached value AND the api is unreachable (e.g. fresh install offline).
 *
 * `isHostTrusted` and `listTrustedHosts` stay synchronous and read the
 * module-level cache. Callers that care about freshness should `await`
 * `loadTrustedHostsRegistry()` first (typically once at app startup).
 */

import {
  fetchRegistry,
  type RegistryFetchOptions,
} from './registry-fetch';
import {
  loadFromStorage,
  saveToStorage,
  type PersistedRegistry,
} from './registry-storage';

/**
 * NFKC + trim + lowercase. Used at Set-build time and at lookup time so
 * Unicode/IDN homoglyph and whitespace bypasses don't slip past the trust
 * check.
 */
function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

const ASCII_PRINTABLE = /^[\x21-\x7e]+$/;

/**
 * Hardcoded safety net. Used when no persistent cache exists AND api is
 * unreachable (fresh install offline). Once any successful load happens
 * — from storage or network — this set is no longer consulted.
 */
const FALLBACK_HOSTS: ReadonlyArray<string> = ['dial.to', 'actions.dialect.to', 'solana.dial.to'];

const TTL_MS = 60 * 60 * 1000; // 1h, matches api Cache-Control: max-age=3600

interface RegistryCache {
  hosts: Set<string>;
  version: string;
  loadedAt: number;
}

let cache: RegistryCache | null = null;
let inflightLoad: Promise<void> | null = null;

function buildHostSet(rawHosts: ReadonlyArray<string>): Set<string> {
  const out = new Set<string>();
  for (const h of rawHosts) {
    if (typeof h !== 'string') continue;
    const n = normalize(h);
    if (n.length === 0) continue;
    if (!ASCII_PRINTABLE.test(n)) continue;
    out.add(n);
  }
  return out;
}

function fallbackCache(): RegistryCache {
  return {
    hosts: buildHostSet(FALLBACK_HOSTS),
    version: 'fallback',
    loadedAt: Date.now(),
  };
}

export interface LoadRegistryOptions extends RegistryFetchOptions {
  /** Ignore the in-memory TTL and force a network refetch. */
  force?: boolean;
}

export async function loadTrustedHostsRegistry(opts?: LoadRegistryOptions): Promise<void> {
  if (inflightLoad) return inflightLoad;
  if (!opts?.force && cache && Date.now() - cache.loadedAt < TTL_MS) {
    return;
  }
  inflightLoad = doLoad(opts).finally(() => {
    inflightLoad = null;
  });
  return inflightLoad;
}

async function doLoad(opts?: LoadRegistryOptions): Promise<void> {
  // 1. Restore from persistent storage immediately so callers have *something*
  //    trustworthy if the network call is slow/fails. Skip if cache is
  //    already populated (keeps prior in-memory state across forced refetch).
  if (!cache) {
    const persisted = await loadFromStorage();
    if (persisted) {
      cache = {
        hosts: buildHostSet(persisted.hosts),
        version: persisted.version,
        loadedAt: persisted.persistedAt,
      };
    }
  }

  // 2. Try the api. On success, replace cache + persist.
  try {
    const fresh = await fetchRegistry(opts);
    cache = {
      hosts: buildHostSet(fresh.hosts),
      version: fresh.version,
      loadedAt: Date.now(),
    };
    const toPersist: PersistedRegistry = {
      version: fresh.version,
      hosts: fresh.hosts,
      persistedAt: cache.loadedAt,
    };
    await saveToStorage(toPersist);
    return;
  } catch {
    // Fall through to fallback handling.
  }

  // 3. api failed. If we already have any cache (persisted or prior session),
  //    keep it. Otherwise drop to the hardcoded safety net.
  if (!cache) {
    cache = fallbackCache();
  }
}

/**
 * The current registry version. Returns 'fallback' when no successful load
 * has occurred and the safety net is in use, or 'unloaded' when no load has
 * been attempted at all.
 */
export function getRegistryVersion(): string {
  return cache?.version ?? 'unloaded';
}

export function listTrustedHosts(): string[] {
  const hosts = cache?.hosts ?? buildHostSet(FALLBACK_HOSTS);
  return Array.from(hosts).sort();
}

export function isHostTrusted(host: string): boolean {
  if (!host) return false;
  const normalized = normalize(host);
  if (!normalized) return false;
  if (
    normalized.includes('/') ||
    normalized.includes(':') ||
    normalized.includes('@') ||
    normalized.includes('[') ||
    normalized.includes(']')
  ) {
    return false;
  }
  if (!ASCII_PRINTABLE.test(normalized)) return false;
  const hosts = cache?.hosts ?? buildHostSet(FALLBACK_HOSTS);
  return hosts.has(normalized);
}

/**
 * Test-only escape hatch. Resets module-level cache + dedupe state so each
 * spec starts from a clean slate. Not exported via the package barrel.
 */
export function __resetRegistryForTests(): void {
  cache = null;
  inflightLoad = null;
}
