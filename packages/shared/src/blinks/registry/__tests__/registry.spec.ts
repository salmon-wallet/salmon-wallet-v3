import { describe, expect, it } from 'vitest';

import { isHostTrusted, listTrustedHosts } from '../registry';

describe('blinks registry', () => {
  describe('listTrustedHosts', () => {
    it('returns the hosts from the pinned snapshot', () => {
      const hosts = listTrustedHosts();
      expect(hosts).toContain('dial.to');
      expect(hosts.length).toBeGreaterThan(0);
    });

    it('returns hosts sorted', () => {
      const hosts = listTrustedHosts();
      const sorted = [...hosts].sort();
      expect(hosts).toEqual(sorted);
    });
  });

  describe('isHostTrusted', () => {
    it('returns true for a known host', () => {
      expect(isHostTrusted('dial.to')).toBe(true);
    });

    it('returns false for an unknown host', () => {
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

    it('accepts known host with leading whitespace (trimmed to trusted value)', () => {
      expect(isHostTrusted(' dial.to')).toBe(true);
    });

    it('rejects IPv6 bracket literal', () => {
      expect(isHostTrusted('[::1]')).toBe(false);
    });

    it('accepts known host with trailing whitespace (trimmed to trusted value)', () => {
      expect(isHostTrusted('dial.to ')).toBe(true);
    });
  });
});
