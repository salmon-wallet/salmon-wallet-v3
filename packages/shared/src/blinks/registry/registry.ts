import snapshot from './registry-snapshot.json';

interface RegistryEntry {
  host?: string;
}

/**
 * NFKC + trim + lowercase. Used at Set-build time and at lookup time so
 * Unicode/IDN homoglyph and whitespace bypasses don't slip past the trust
 * check.
 */
function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

const ASCII_PRINTABLE = /^[\x21-\x7e]+$/;

// The cast below mirrors the JSON shape, but since JSON-import types can
// drift from runtime contents the actual guarantee is the `typeof h === 'string'`
// runtime filter applied below.
const HOSTS = new Set<string>(
  ((snapshot.actions ?? []) as RegistryEntry[])
    .map((e) => (typeof e.host === 'string' ? normalize(e.host) : ''))
    .filter((h): h is string => typeof h === 'string' && h.length > 0 && ASCII_PRINTABLE.test(h)),
);

export const REGISTRY_VERSION = (snapshot.version as string | undefined) ?? 'unknown';

export function listTrustedHosts(): string[] {
  return Array.from(HOSTS).sort();
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
  return HOSTS.has(normalized);
}
