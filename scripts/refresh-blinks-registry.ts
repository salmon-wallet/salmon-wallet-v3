/**
 * Refresh the pinned Dialect Actions registry snapshot used by the blinks
 * trust root.
 *
 * Manual run only — NOT wired into CI:
 *   pnpm tsx scripts/refresh-blinks-registry.ts
 *
 * Behavior:
 * - Fetches the official Dialect registry endpoint.
 * - Aborts (non-zero exit, no write) on non-200 or unexpected shape.
 * - Writes a fresh snapshot with `source: 'dialect-registry'` and current ISO
 *   date as `version`.
 * - Prints stats: count before, count after, added/removed diff.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REGISTRY_URL = 'https://actions-registry.dialectapi.to/all';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = resolve(
  __dirname,
  '..',
  'packages',
  'shared',
  'src',
  'blinks',
  'registry',
  'registry-snapshot.json',
);

interface SnapshotEntry {
  host?: string;
}

interface Snapshot {
  version: string;
  source: string;
  actions: SnapshotEntry[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function extractHost(entry: unknown): string | null {
  if (typeof entry === 'string') {
    const trimmed = entry.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (!isPlainObject(entry)) return null;

  const candidate =
    (typeof entry.host === 'string' && entry.host.trim()) ||
    (typeof entry.actionUrl === 'string' && entry.actionUrl) ||
    (typeof entry.websiteUrl === 'string' && entry.websiteUrl) ||
    (typeof entry.url === 'string' && entry.url) ||
    null;

  if (!candidate) return null;

  try {
    if (candidate.includes('://')) {
      return new URL(candidate).hostname.toLowerCase();
    }
    return candidate.toLowerCase();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  console.log(`Fetching ${REGISTRY_URL} ...`);
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    console.error(`Registry fetch failed: HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const body: unknown = await res.json();
  let raw: unknown[];
  if (Array.isArray(body)) {
    raw = body;
  } else if (isPlainObject(body) && Array.isArray(body.actions)) {
    raw = body.actions;
  } else {
    console.error('Registry response shape not recognized (expected array or { actions: [...] }).');
    process.exit(1);
  }

  const fresh = Array.from(
    new Set(raw.map(extractHost).filter((h): h is string => typeof h === 'string' && h.length > 0)),
  ).sort();

  if (fresh.length === 0) {
    console.error('Refusing to overwrite snapshot — registry returned zero hosts.');
    process.exit(1);
  }

  let prev: Snapshot | null = null;
  try {
    prev = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot;
  } catch {
    prev = null;
  }
  const prevHosts = new Set(
    (prev?.actions ?? [])
      .map((e) => e.host?.toLowerCase())
      .filter((h): h is string => typeof h === 'string' && h.length > 0),
  );

  const added = fresh.filter((h) => !prevHosts.has(h));
  const removed = Array.from(prevHosts).filter((h) => !fresh.includes(h));

  const MAX_HOSTS = 500;
  if (fresh.length > MAX_HOSTS) {
    console.error(`Refusing: fresh count ${fresh.length} exceeds safety ceiling ${MAX_HOSTS}.`);
    process.exit(1);
  }
  const MAX_ADDED_PCT = 0.25;
  const addedPct = added.length / Math.max(prevHosts.size, 1);
  if (prevHosts.size > 0 && addedPct > MAX_ADDED_PCT) {
    console.error(
      `Refusing: ${added.length} new hosts (${(addedPct * 100).toFixed(0)}%) exceeds safe growth threshold. Review manually.`,
    );
    process.exit(1);
  }

  const next: Snapshot = {
    version: new Date().toISOString().slice(0, 10),
    source: 'dialect-registry',
    actions: fresh.map((host) => ({ host })),
  };

  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`Snapshot updated: ${SNAPSHOT_PATH}`);
  console.log(`  before: ${prevHosts.size}`);
  console.log(`  after:  ${fresh.length}`);
  console.log(`  added (${added.length}): ${added.join(', ') || '-'}`);
  console.log(`  removed (${removed.length}): ${removed.join(', ') || '-'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
