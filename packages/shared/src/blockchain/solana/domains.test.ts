/**
 * Solana Domain Name Services Tests
 *
 * Tests for:
 * - SPL Name Service (.sol domains via Bonfida)
 * - AllDomains (multiple TLDs via TldParser)
 * - Combined functions with fallback
 *
 * Uses mocked responses when services are unavailable, or tests against real services if available.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import * as BonfidaNameService from '@bonfida/spl-name-service';
import { TldParser } from '@onsol/tldparser';
import {
  getSolDomain,
  resolveSolDomain,
  getAllDomain,
  resolveAllDomain,
  getDomain,
  getDomainFromPublicKey,
  getPublicKeyFromDomain,
} from './domains';
import { SOLANA_NETWORKS } from './factory';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Bonfida SPL Name Service
vi.mock('@bonfida/spl-name-service', () => ({
  getFavoriteDomain: vi.fn(),
  resolve: vi.fn(),
}));

// Mock TldParser
vi.mock('@onsol/tldparser', () => ({
  TldParser: vi.fn(),
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if Solana RPC is available for integration tests
 */
async function isRpcAvailable(nodeUrl: string): Promise<boolean> {
  try {
    const connection = new Connection(nodeUrl);
    await connection.getVersion();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Test Data
// ============================================================================

/**
 * Test public keys and domains
 */
const TEST_DATA = {
  // Known .sol domain (Bonfida example)
  solDomain: {
    name: 'bonfida',
    fullName: 'bonfida.sol',
    publicKey: new PublicKey('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA'),
    publicKeyString: 'HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA',
  },
  // Test AllDomains domain
  allDomain: {
    name: 'test.abc',
    publicKey: new PublicKey('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'),
    publicKeyString: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    tld: '.abc',
  },
  // Test public key without domain
  noDomain: {
    publicKey: new PublicKey('11111111111111111111111111111111'),
    publicKeyString: '11111111111111111111111111111111',
  },
};

// ============================================================================
// SPL Name Service (.sol domains) Tests
// ============================================================================

describe('SPL Name Service (.sol domains)', () => {
  const network = SOLANA_NETWORKS.mainnet;
  let connection: Connection;

  beforeEach(() => {
    vi.clearAllMocks();
    connection = new Connection(network.config.nodeUrl);
  });

  describe('getSolDomain', () => {
    it('should get .sol domain for a public key', async () => {
      // Mock Bonfida's getFavoriteDomain
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: TEST_DATA.solDomain.name,
        reverse: TEST_DATA.solDomain.publicKey,
        stale: false,
      } as any);

      const result = await getSolDomain(connection, TEST_DATA.solDomain.publicKey);

      expect(BonfidaNameService.getFavoriteDomain).toHaveBeenCalledWith(
        connection,
        TEST_DATA.solDomain.publicKey
      );
      expect(result).toBe(TEST_DATA.solDomain.fullName);
    });

    it('should append .sol extension to domain name', async () => {
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: 'testdomain',
        reverse: TEST_DATA.solDomain.publicKey,
        stale: false,
      } as any);

      const result = await getSolDomain(connection, TEST_DATA.solDomain.publicKey);

      expect(result).toBe('testdomain.sol');
    });

    it('should return null if no domain found', async () => {
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: null,
      } as any);

      const result = await getSolDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockRejectedValueOnce(
        new Error('Domain not found')
      );

      const result = await getSolDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });

    it('should handle undefined domain in response', async () => {
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: undefined,
      } as any);

      const result = await getSolDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });
  });

  describe('resolveSolDomain', () => {
    it('should resolve .sol domain to public key', async () => {
      vi.mocked(BonfidaNameService.resolve).mockResolvedValueOnce(
        TEST_DATA.solDomain.publicKey
      );

      const result = await resolveSolDomain(connection, TEST_DATA.solDomain.fullName);

      expect(BonfidaNameService.resolve).toHaveBeenCalledWith(
        connection,
        TEST_DATA.solDomain.name
      );
      expect(result).toBe(TEST_DATA.solDomain.publicKeyString);
    });

    it('should handle domain without .sol extension', async () => {
      vi.mocked(BonfidaNameService.resolve).mockResolvedValueOnce(
        TEST_DATA.solDomain.publicKey
      );

      const result = await resolveSolDomain(connection, TEST_DATA.solDomain.name);

      expect(BonfidaNameService.resolve).toHaveBeenCalledWith(
        connection,
        TEST_DATA.solDomain.name
      );
      expect(result).toBe(TEST_DATA.solDomain.publicKeyString);
    });

    it('should handle domain with .sol extension', async () => {
      vi.mocked(BonfidaNameService.resolve).mockResolvedValueOnce(
        TEST_DATA.solDomain.publicKey
      );

      const result = await resolveSolDomain(connection, 'bonfida.sol');

      // Should strip .sol before calling resolve
      expect(BonfidaNameService.resolve).toHaveBeenCalledWith(connection, 'bonfida');
      expect(result).toBe(TEST_DATA.solDomain.publicKeyString);
    });

    it('should return null if domain not found', async () => {
      vi.mocked(BonfidaNameService.resolve).mockResolvedValueOnce(null as any);

      const result = await resolveSolDomain(connection, 'nonexistent.sol');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(BonfidaNameService.resolve).mockRejectedValueOnce(
        new Error('Invalid domain')
      );

      const result = await resolveSolDomain(connection, 'invalid.sol');

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// AllDomains (multiple TLDs) Tests
// ============================================================================

describe('AllDomains (multiple TLDs)', () => {
  const network = SOLANA_NETWORKS.mainnet;
  let connection: Connection;

  beforeEach(() => {
    vi.clearAllMocks();
    connection = new Connection(network.config.nodeUrl);
  });

  describe('getAllDomain', () => {
    it('should get AllDomains domain for a public key', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: 'test',
          tld: '.abc',
          owner: TEST_DATA.allDomain.publicKey,
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.allDomain.publicKey);

      expect(mockParser.getMainDomain).toHaveBeenCalledWith(TEST_DATA.allDomain.publicKey);
      expect(result).toBe(TEST_DATA.allDomain.name);
    });

    it('should concatenate domain and tld', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: 'myname',
          tld: '.bonk',
          owner: TEST_DATA.allDomain.publicKey,
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.allDomain.publicKey);

      expect(result).toBe('myname.bonk');
    });

    it('should return null if no domain found', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce(null),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });

    it('should return null if domain is missing', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: null,
          tld: '.abc',
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });

    it('should return null if tld is missing', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: 'test',
          tld: null,
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockRejectedValueOnce(new Error('Domain not found')),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getAllDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });
  });

  describe('resolveAllDomain', () => {
    it('should resolve AllDomains domain to public key', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(TEST_DATA.allDomain.publicKey),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await resolveAllDomain(connection, TEST_DATA.allDomain.name);

      expect(mockParser.getOwnerFromDomainTld).toHaveBeenCalledWith(TEST_DATA.allDomain.name);
      expect(result).toBe(TEST_DATA.allDomain.publicKeyString);
    });

    it('should handle various TLDs', async () => {
      const domains = ['test.abc', 'myname.bonk', 'example.poor'];

      for (const domain of domains) {
        const mockParser = {
          getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(TEST_DATA.allDomain.publicKey),
        };

        vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

        const result = await resolveAllDomain(connection, domain);

        expect(mockParser.getOwnerFromDomainTld).toHaveBeenCalledWith(domain);
        expect(result).toBe(TEST_DATA.allDomain.publicKeyString);
      }
    });

    it('should return null if domain not found', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(null),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await resolveAllDomain(connection, 'nonexistent.abc');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockRejectedValueOnce(new Error('Invalid domain')),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await resolveAllDomain(connection, 'invalid.xyz');

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Combined Functions (with fallback) Tests
// ============================================================================

describe('Combined Domain Functions', () => {
  const network = SOLANA_NETWORKS.mainnet;
  let connection: Connection;

  beforeEach(() => {
    vi.clearAllMocks();
    connection = new Connection(network.config.nodeUrl);
  });

  describe('getDomain', () => {
    it('should try AllDomains first, then fall back to .sol', async () => {
      // AllDomains returns null
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce(null),
      };
      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      // Bonfida returns a domain
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: TEST_DATA.solDomain.name,
        reverse: TEST_DATA.solDomain.publicKey,
        stale: false,
      } as any);

      const result = await getDomain(connection, TEST_DATA.solDomain.publicKey);

      expect(mockParser.getMainDomain).toHaveBeenCalled();
      expect(BonfidaNameService.getFavoriteDomain).toHaveBeenCalled();
      expect(result).toBe(TEST_DATA.solDomain.fullName);
    });

    it('should return AllDomains result if found', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: 'test',
          tld: '.abc',
          owner: TEST_DATA.allDomain.publicKey,
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getDomain(connection, TEST_DATA.allDomain.publicKey);

      expect(result).toBe(TEST_DATA.allDomain.name);
      // Should not call Bonfida if AllDomains succeeds
      expect(BonfidaNameService.getFavoriteDomain).not.toHaveBeenCalled();
    });

    it('should return null if both fail', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce(null),
      };
      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);
      vi.mocked(BonfidaNameService.getFavoriteDomain).mockResolvedValueOnce({
        domain: null,
      } as any);

      const result = await getDomain(connection, TEST_DATA.noDomain.publicKey);

      expect(result).toBeNull();
    });
  });

  describe('getDomainFromPublicKey', () => {
    it('should be an alias for getDomain', async () => {
      const mockParser = {
        getMainDomain: vi.fn().mockResolvedValueOnce({
          domain: 'test',
          tld: '.abc',
          owner: TEST_DATA.allDomain.publicKey,
        }),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getDomainFromPublicKey(connection, TEST_DATA.allDomain.publicKey);

      expect(result).toBe(TEST_DATA.allDomain.name);
    });
  });

  describe('getPublicKeyFromDomain', () => {
    it('should use resolveSolDomain for .sol domains', async () => {
      vi.mocked(BonfidaNameService.resolve).mockResolvedValueOnce(
        TEST_DATA.solDomain.publicKey
      );

      const result = await getPublicKeyFromDomain(connection, 'bonfida.sol');

      expect(BonfidaNameService.resolve).toHaveBeenCalledWith(connection, 'bonfida');
      expect(result).toBe(TEST_DATA.solDomain.publicKeyString);
    });

    it('should use resolveAllDomain for other TLDs', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(TEST_DATA.allDomain.publicKey),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getPublicKeyFromDomain(connection, 'test.abc');

      expect(mockParser.getOwnerFromDomainTld).toHaveBeenCalledWith('test.abc');
      expect(result).toBe(TEST_DATA.allDomain.publicKeyString);
    });

    it('should handle .bonk domain', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(TEST_DATA.allDomain.publicKey),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getPublicKeyFromDomain(connection, 'myname.bonk');

      expect(mockParser.getOwnerFromDomainTld).toHaveBeenCalledWith('myname.bonk');
      expect(result).toBe(TEST_DATA.allDomain.publicKeyString);
    });

    it('should handle .poor domain', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(TEST_DATA.allDomain.publicKey),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getPublicKeyFromDomain(connection, 'example.poor');

      expect(mockParser.getOwnerFromDomainTld).toHaveBeenCalledWith('example.poor');
      expect(result).toBe(TEST_DATA.allDomain.publicKeyString);
    });

    it('should return null if domain cannot be resolved', async () => {
      const mockParser = {
        getOwnerFromDomainTld: vi.fn().mockResolvedValueOnce(null),
      };

      vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

      const result = await getPublicKeyFromDomain(connection, 'nonexistent.xyz');

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Domain Error Handling', () => {
  const network = SOLANA_NETWORKS.mainnet;
  let connection: Connection;

  beforeEach(() => {
    vi.clearAllMocks();
    connection = new Connection(network.config.nodeUrl);
  });

  it('should handle malformed domains gracefully', async () => {
    const malformedDomains = ['', '.sol', 'nodot', '..doubledot', 'spaces in name.sol'];

    for (const domain of malformedDomains) {
      vi.mocked(BonfidaNameService.resolve).mockRejectedValueOnce(
        new Error('Invalid domain')
      );

      const result = await resolveSolDomain(connection, domain);
      expect(result).toBeNull();
    }
  });

  it('should handle very long domain names', async () => {
    const longDomain = 'a'.repeat(1000) + '.sol';

    vi.mocked(BonfidaNameService.resolve).mockRejectedValueOnce(
      new Error('Domain too long')
    );

    const result = await resolveSolDomain(connection, longDomain);
    expect(result).toBeNull();
  });

  it('should handle network timeouts gracefully', async () => {
    vi.mocked(BonfidaNameService.getFavoriteDomain).mockRejectedValueOnce(
      new Error('Network timeout')
    );

    const result = await getSolDomain(connection, TEST_DATA.noDomain.publicKey);
    expect(result).toBeNull();
  });

  it('should handle invalid public keys in TldParser', async () => {
    const mockParser = {
      getMainDomain: vi.fn().mockRejectedValueOnce(new Error('Invalid public key')),
    };

    vi.mocked(TldParser).mockImplementationOnce(() => mockParser as any);

    const result = await getAllDomain(connection, TEST_DATA.noDomain.publicKey);
    expect(result).toBeNull();
  });
});

// ============================================================================
// Integration Tests (Optional - only run if RPC is available)
// ============================================================================

describe('Domain Integration Tests (optional)', () => {
  const network = SOLANA_NETWORKS.mainnet;

  it.skip('should resolve real .sol domain if RPC available', async () => {
    const connection = new Connection(network.config.nodeUrl);
    const available = await isRpcAvailable(network.config.nodeUrl);

    if (!available) {
      console.log('RPC not available, skipping integration test');
      return;
    }

    // Test with known .sol domain (bonfida.sol)
    const result = await resolveSolDomain(connection, 'bonfida.sol');

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it.skip('should get real domain for public key if RPC available', async () => {
    const connection = new Connection(network.config.nodeUrl);
    const available = await isRpcAvailable(network.config.nodeUrl);

    if (!available) {
      console.log('RPC not available, skipping integration test');
      return;
    }

    // Test with known public key (Bonfida)
    const publicKey = new PublicKey('HKKp49qGWXd639QsuH7JiLijfVW5UtCVY4s1n2HANwEA');
    const result = await getDomain(connection, publicKey);

    // May return null if the public key doesn't have a favorite domain set
    if (result) {
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\./); // Should contain a dot (TLD separator)
    }
  });
});
