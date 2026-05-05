import snapshot from './registry-snapshot.json';

interface RegistryEntry {
  host?: string;
}

const HOSTS = new Set<string>(
  ((snapshot.actions ?? []) as RegistryEntry[])
    .map((e) => e.host?.toLowerCase())
    .filter((h): h is string => typeof h === 'string' && h.length > 0),
);

export function listTrustedHosts(): string[] {
  return Array.from(HOSTS).sort();
}

export function isHostTrusted(host: string): boolean {
  if (!host) return false;
  if (host.includes('/') || host.includes(':')) return false;
  return HOSTS.has(host.toLowerCase());
}
