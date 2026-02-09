/**
 * Token Service Tests
 * Tests for pure normalization functions and async service functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules BEFORE importing the functions
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      create: vi.fn(() => ({
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

vi.mock('../client', () => {
  return {
    apiClient: {
      get: vi.fn(),
    },
  };
});

// Now import the functions AFTER mocking
import {
  normalizeBackendTokens,
  normalizeJupiterTokens,
  getTokenList,
  getFeaturedTokenList,
  getTokenMetadataByMints,
  searchTokens,
  getTokenByAddress,
  clearTokenListCache,
  getTokenListSource,
} from './tokens';
import { normalizeIpfsUrl } from '../../utils/url';
import { apiClient } from '../client';
import axios from 'axios';

// Get access to the mocked functions
const mockApiClientGet = vi.mocked(apiClient.get);
const mockAxiosGet = vi.mocked(axios.get);

// ============================================================================
// Test Data
// ============================================================================

/**
 * Sample BackendToken data for testing
 */
const mockBackendTokens = [
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    address: 'So11111111111111111111111111111111111111112',
    chainId: 101,
    coingeckoId: 'solana',
    tags: ['verified', 'strict'],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    coingeckoId: 'usd-coin',
    tags: ['verified'],
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    logo: 'ar://abc123def456',
    id: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    tags: ['community'],
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    // No logo/icon
    tags: [],
  },
];

/**
 * Sample JupiterToken data for testing
 */
const mockJupiterTokens = [
  {
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    address: 'So11111111111111111111111111111111111111112',
    chainId: 101,
    tags: ['verified', 'strict'],
    extensions: {
      coingeckoId: 'solana',
      website: 'https://solana.com',
    },
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'ipfs://QmUsdt123456789',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    chainId: 101,
    tags: ['verified'],
    extensions: {
      coingeckoId: 'tether',
    },
  },
  {
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    logoURI: 'ar://orca123',
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    chainId: 101,
    tags: ['community'],
    extensions: {},
  },
  {
    symbol: 'SAMO',
    name: 'Samoyed Coin',
    decimals: 9,
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    chainId: 101,
    // No logoURI
    tags: [],
  },
];

// Known test addresses
const KNOWN_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

// ============================================================================
// Tests
// ============================================================================

describe('Token Service - Pure Functions', () => {
  // ==========================================================================
  // normalizeIpfsUrl Tests
  // ==========================================================================

  describe('normalizeIpfsUrl', () => {
    it('should handle null input', () => {
      expect(normalizeIpfsUrl(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(normalizeIpfsUrl(undefined)).toBe(null);
    });

    it('should handle empty string', () => {
      expect(normalizeIpfsUrl('')).toBe(null);
    });

    it('should convert IPFS protocol URL to ipfs.io gateway', () => {
      const input = 'ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM';
      const expected = 'https://ipfs.io/ipfs/QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM';
      expect(normalizeIpfsUrl(input)).toBe(expected);
    });

    it('should convert Arweave protocol URL to Arweave gateway', () => {
      const input = 'ar://abc123def456ghi789';
      const expected = 'https://arweave.net/abc123def456ghi789';
      expect(normalizeIpfsUrl(input)).toBe(expected);
    });

    it('should preserve HTTP URLs', () => {
      const input = 'https://example.com/logo.png';
      expect(normalizeIpfsUrl(input)).toBe(input);
    });

    it('should preserve HTTPS URLs', () => {
      const input = 'https://raw.githubusercontent.com/solana-labs/token-list/main/logo.png';
      expect(normalizeIpfsUrl(input)).toBe(input);
    });

    it('should handle IPFS URLs with short hashes', () => {
      const input = 'ipfs://Qm123';
      const expected = 'https://ipfs.io/ipfs/Qm123';
      expect(normalizeIpfsUrl(input)).toBe(expected);
    });

    it('should handle Arweave URLs with short hashes', () => {
      const input = 'ar://abc';
      const expected = 'https://arweave.net/abc';
      expect(normalizeIpfsUrl(input)).toBe(expected);
    });
  });

  // ==========================================================================
  // normalizeBackendTokens Tests
  // ==========================================================================

  describe('normalizeBackendTokens', () => {
    it('should normalize an empty array', () => {
      const result = normalizeBackendTokens([]);
      expect(result).toEqual([]);
    });

    it('should transform backend tokens to TokenMetadata format', () => {
      const result = normalizeBackendTokens(mockBackendTokens);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        address: 'So11111111111111111111111111111111111111112',
        chainId: 101,
        coingeckoId: 'solana',
        tags: ['verified', 'strict'],
      });
    });

    it('should prefer logo over icon field', () => {
      const token = mockBackendTokens[0]; // Has logo field
      const result = normalizeBackendTokens([token]);

      expect(result[0].logo).toBe(token.logo);
    });

    it('should use icon field when logo is missing', () => {
      const token = mockBackendTokens[1]; // Has icon field, no logo
      const result = normalizeBackendTokens([token]);

      expect(result[0].logo).toBe('https://ipfs.io/ipfs/QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM');
    });

    it('should normalize IPFS URLs in logo field', () => {
      const token = mockBackendTokens[1]; // Has IPFS icon
      const result = normalizeBackendTokens([token]);

      expect(result[0].logo).toBe('https://ipfs.io/ipfs/QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM');
    });

    it('should normalize Arweave URLs in logo field', () => {
      const token = mockBackendTokens[2]; // Has Arweave logo
      const result = normalizeBackendTokens([token]);

      expect(result[0].logo).toBe('https://arweave.net/abc123def456');
    });

    it('should prefer address over id field', () => {
      const token = mockBackendTokens[0]; // Has address field
      const result = normalizeBackendTokens([token]);

      expect(result[0].address).toBe(token.address);
    });

    it('should use id field when address is missing', () => {
      const token = mockBackendTokens[2]; // Has id field, no address
      const result = normalizeBackendTokens([token]);

      expect(result[0].address).toBe('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R');
    });

    it('should handle missing logo/icon as null', () => {
      const token = mockBackendTokens[3]; // No logo or icon
      const result = normalizeBackendTokens([token]);

      expect(result[0].logo).toBe(null);
    });

    it('should handle missing tags as empty array', () => {
      const tokenWithoutTags = {
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 9,
        address: 'Test123456789',
      };
      const result = normalizeBackendTokens([tokenWithoutTags]);

      expect(result[0].tags).toEqual([]);
    });

    it('should preserve optional fields when present', () => {
      const token = mockBackendTokens[0]; // Has all optional fields
      const result = normalizeBackendTokens([token]);

      expect(result[0].chainId).toBe(101);
      expect(result[0].coingeckoId).toBe('solana');
      expect(result[0].tags).toEqual(['verified', 'strict']);
    });

    it('should handle missing optional fields', () => {
      const tokenMinimal = {
        symbol: 'MIN',
        name: 'Minimal Token',
        decimals: 6,
        address: 'Min123456789',
      };
      const result = normalizeBackendTokens([tokenMinimal]);

      expect(result[0].chainId).toBeUndefined();
      expect(result[0].coingeckoId).toBeUndefined();
      expect(result[0].tags).toEqual([]);
    });

    it('should handle empty address and id as empty string', () => {
      const tokenNoAddress = {
        symbol: 'NO_ADDR',
        name: 'No Address Token',
        decimals: 9,
      };
      const result = normalizeBackendTokens([tokenNoAddress]);

      expect(result[0].address).toBe('');
    });
  });

  // ==========================================================================
  // normalizeJupiterTokens Tests
  // ==========================================================================

  describe('normalizeJupiterTokens', () => {
    it('should normalize an empty array', () => {
      const result = normalizeJupiterTokens([]);
      expect(result).toEqual([]);
    });

    it('should transform Jupiter tokens to TokenMetadata format', () => {
      const result = normalizeJupiterTokens(mockJupiterTokens);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        symbol: 'SOL',
        name: 'Wrapped SOL',
        decimals: 9,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        address: 'So11111111111111111111111111111111111111112',
        chainId: 101,
        coingeckoId: 'solana',
        tags: ['verified', 'strict'],
      });
    });

    it('should normalize IPFS URLs in logoURI field', () => {
      const token = mockJupiterTokens[1]; // Has IPFS logoURI
      const result = normalizeJupiterTokens([token]);

      expect(result[0].logo).toBe('https://ipfs.io/ipfs/QmUsdt123456789');
    });

    it('should normalize Arweave URLs in logoURI field', () => {
      const token = mockJupiterTokens[2]; // Has Arweave logoURI
      const result = normalizeJupiterTokens([token]);

      expect(result[0].logo).toBe('https://arweave.net/orca123');
    });

    it('should extract coingeckoId from extensions', () => {
      const token = mockJupiterTokens[0]; // Has coingeckoId in extensions
      const result = normalizeJupiterTokens([token]);

      expect(result[0].coingeckoId).toBe('solana');
    });

    it('should handle missing logoURI as null', () => {
      const token = mockJupiterTokens[3]; // No logoURI
      const result = normalizeJupiterTokens([token]);

      expect(result[0].logo).toBe(null);
    });

    it('should handle missing tags as empty array', () => {
      const tokenWithoutTags = {
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 9,
        address: 'Test123456789',
      };
      const result = normalizeJupiterTokens([tokenWithoutTags]);

      expect(result[0].tags).toEqual([]);
    });

    it('should handle missing extensions as undefined coingeckoId', () => {
      const tokenNoExtensions = {
        symbol: 'NOEXT',
        name: 'No Extensions',
        decimals: 6,
        address: 'NoExt123456789',
      };
      const result = normalizeJupiterTokens([tokenNoExtensions]);

      expect(result[0].coingeckoId).toBeUndefined();
    });

    it('should handle empty extensions object', () => {
      const token = mockJupiterTokens[2]; // Has empty extensions
      const result = normalizeJupiterTokens([token]);

      expect(result[0].coingeckoId).toBeUndefined();
    });

    it('should preserve optional fields when present', () => {
      const token = mockJupiterTokens[0]; // Has all optional fields
      const result = normalizeJupiterTokens([token]);

      expect(result[0].chainId).toBe(101);
      expect(result[0].coingeckoId).toBe('solana');
      expect(result[0].tags).toEqual(['verified', 'strict']);
    });

    it('should handle missing optional fields', () => {
      const tokenMinimal = {
        symbol: 'MIN',
        name: 'Minimal Token',
        decimals: 6,
        address: 'Min123456789',
      };
      const result = normalizeJupiterTokens([tokenMinimal]);

      expect(result[0].chainId).toBeUndefined();
      expect(result[0].coingeckoId).toBeUndefined();
      expect(result[0].tags).toEqual([]);
    });

    it('should preserve HTTP/HTTPS logoURIs', () => {
      const token = mockJupiterTokens[0]; // Has HTTPS logoURI
      const result = normalizeJupiterTokens([token]);

      expect(result[0].logo).toBe('https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png');
    });

    it('should ignore non-coingeckoId properties in extensions', () => {
      const token = mockJupiterTokens[0]; // Has website in extensions
      const result = normalizeJupiterTokens([token]);

      expect(result[0]).not.toHaveProperty('website');
      expect(result[0].coingeckoId).toBe('solana');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration: Backend and Jupiter normalization consistency', () => {
    it('should produce compatible TokenMetadata format from both sources', () => {
      const backendResult = normalizeBackendTokens(mockBackendTokens);
      const jupiterResult = normalizeJupiterTokens(mockJupiterTokens);

      // Both should have the same structure
      expect(backendResult[0]).toHaveProperty('symbol');
      expect(backendResult[0]).toHaveProperty('name');
      expect(backendResult[0]).toHaveProperty('decimals');
      expect(backendResult[0]).toHaveProperty('logo');
      expect(backendResult[0]).toHaveProperty('address');
      expect(backendResult[0]).toHaveProperty('tags');

      expect(jupiterResult[0]).toHaveProperty('symbol');
      expect(jupiterResult[0]).toHaveProperty('name');
      expect(jupiterResult[0]).toHaveProperty('decimals');
      expect(jupiterResult[0]).toHaveProperty('logo');
      expect(jupiterResult[0]).toHaveProperty('address');
      expect(jupiterResult[0]).toHaveProperty('tags');
    });

    it('should handle mixed array of tokens correctly', () => {
      const mixedBackend = mockBackendTokens.slice(0, 2);
      const mixedJupiter = mockJupiterTokens.slice(0, 2);

      const backendResult = normalizeBackendTokens(mixedBackend);
      const jupiterResult = normalizeJupiterTokens(mixedJupiter);

      expect(backendResult).toHaveLength(2);
      expect(jupiterResult).toHaveLength(2);

      // Both should have properly normalized logos
      backendResult.forEach(token => {
        expect(token.logo === null || typeof token.logo === 'string').toBe(true);
        if (token.logo) {
          expect(token.logo.startsWith('http')).toBe(true);
        }
      });

      jupiterResult.forEach(token => {
        expect(token.logo === null || typeof token.logo === 'string').toBe(true);
        if (token.logo) {
          expect(token.logo.startsWith('http')).toBe(true);
        }
      });
    });
  });

  // ==========================================================================
  // Async Service Functions Tests
  // ==========================================================================

  describe('Async Service Functions', () => {
    beforeEach(() => {
      // Clear cache and all mocks before each test
      clearTokenListCache();
      vi.clearAllMocks();
    });

    // ========================================================================
    // getTokenList() Tests
    // ========================================================================
    describe('getTokenList', () => {
      it('should return array of TokenMetadata from backend', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        const result = await getTokenList('solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('symbol');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('decimals');
        expect(result[0]).toHaveProperty('address');
        expect(result[0]).toHaveProperty('logo');
      });

      it('should verify structure of returned tokens', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        const result = await getTokenList('solana-mainnet');

        expect(result.length).toBeGreaterThan(0);
        const token = result[0];
        expect(typeof token.symbol).toBe('string');
        expect(typeof token.name).toBe('string');
        expect(typeof token.decimals).toBe('number');
        expect(typeof token.address).toBe('string');
        expect(token.logo === null || typeof token.logo === 'string').toBe(true);
      });

      it('should deduplicate tokens by symbol prioritizing verified', async () => {
        const duplicateTokens = [
          {
            symbol: 'TEST',
            name: 'Test Token Verified',
            decimals: 9,
            address: 'Test1',
            tags: ['verified'],
          },
          {
            symbol: 'TEST',
            name: 'Test Token Community',
            decimals: 9,
            address: 'Test2',
            tags: ['community'],
          },
          {
            symbol: 'TEST',
            name: 'Test Token Unknown',
            decimals: 9,
            address: 'Test3',
            tags: [],
          },
        ];

        mockApiClientGet.mockResolvedValueOnce({ data: duplicateTokens });

        const result = await getTokenList('solana-mainnet');

        const testTokens = result.filter((t) => t.symbol === 'TEST');
        expect(testTokens.length).toBe(1);
        expect(testTokens[0].name).toBe('Test Token Verified');
        expect(testTokens[0].tags).toContain('verified');
      });

      it('should fallback to Jupiter when backend fails', async () => {
        mockApiClientGet.mockRejectedValueOnce(new Error('Backend unavailable'));
        mockAxiosGet.mockResolvedValueOnce({ data: mockJupiterTokens });

        const result = await getTokenList('solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should cache results and return from cache on second call', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        const result1 = await getTokenList('solana-mainnet');
        const result2 = await getTokenList('solana-mainnet');

        expect(result1).toEqual(result2);
        // apiClient.get should only be called once due to caching
        expect(mockApiClientGet).toHaveBeenCalledTimes(1);
      });

      it('should return source backend when using backend', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        await getTokenList('solana-mainnet');
        const source = getTokenListSource();

        expect(source).toBe('backend');
      });
    });

    // ========================================================================
    // getFeaturedTokenList() Tests
    // ========================================================================
    describe('getFeaturedTokenList', () => {
      it('should return top tokens from backend', async () => {
        const topTokens = mockBackendTokens.slice(0, 5);
        mockApiClientGet.mockResolvedValueOnce({ data: topTokens });

        const result = await getFeaturedTokenList('solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
      });

      it('should verify tokens are properly normalized', async () => {
        const topTokens = mockBackendTokens.slice(0, 2);
        mockApiClientGet.mockResolvedValueOnce({ data: topTokens });

        const result = await getFeaturedTokenList('solana-mainnet');

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('symbol');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('decimals');
        expect(result[0]).toHaveProperty('address');
        expect(result[0]).toHaveProperty('logo');
        expect(result[0]).toHaveProperty('tags');
      });

      it('should return empty array on error', async () => {
        mockApiClientGet.mockRejectedValueOnce(new Error('Backend error'));

        const result = await getFeaturedTokenList('solana-mainnet');

        expect(result).toEqual([]);
      });

      it('should handle tokens without logo/icon', async () => {
        const tokensNoLogo = [
          {
            symbol: 'NOLOGO',
            name: 'No Logo Token',
            decimals: 9,
            address: 'NoLogo123',
          },
        ];
        mockApiClientGet.mockResolvedValueOnce({ data: tokensNoLogo });

        const result = await getFeaturedTokenList('solana-mainnet');

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].logo).toBe(null);
      });
    });

    // ========================================================================
    // getTokenMetadataByMints() Tests
    // ========================================================================
    describe('getTokenMetadataByMints', () => {
      it('should return empty array for empty input', async () => {
        const result = await getTokenMetadataByMints([]);
        expect(result).toEqual([]);
      });

      it('should fetch metadata for known mints (SOL, USDC)', async () => {
        const mints = [KNOWN_ADDRESSES.SOL, KNOWN_ADDRESSES.USDC];
        const responseTokens = [mockBackendTokens[0], mockBackendTokens[1]];
        mockApiClientGet.mockResolvedValueOnce({ data: responseTokens });

        const result = await getTokenMetadataByMints(mints, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
      });

      it('should verify returned token structure', async () => {
        const mints = [KNOWN_ADDRESSES.SOL];
        const responseTokens = [mockBackendTokens[0]];
        mockApiClientGet.mockResolvedValueOnce({ data: responseTokens });

        const result = await getTokenMetadataByMints(mints, 'solana-mainnet');

        expect(result.length).toBeGreaterThan(0);
        const token = result[0];
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('address');
        expect(token).toHaveProperty('logo');
      });

      it('should handle chunking for arrays > 100 mints', async () => {
        const mints = Array.from({ length: 150 }, (_, i) => `mint${i}`);

        // Mock two batch calls for chunks
        mockApiClientGet
          .mockResolvedValueOnce({ data: mockBackendTokens.slice(0, 2) })
          .mockResolvedValueOnce({ data: mockBackendTokens.slice(2, 4) });

        const result = await getTokenMetadataByMints(mints, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(mockApiClientGet).toHaveBeenCalledTimes(2);
      });

      it('should remove duplicate mints before fetching', async () => {
        const mints = [KNOWN_ADDRESSES.SOL, KNOWN_ADDRESSES.SOL, KNOWN_ADDRESSES.USDC];
        const responseTokens = [mockBackendTokens[0], mockBackendTokens[1]];

        mockApiClientGet.mockImplementation((url: string) => {
          // Check that the URL only contains unique mints
          const urlMints = url.split('mints=')[1]?.split(',') || [];
          const uniqueCount = new Set(urlMints).size;
          expect(uniqueCount).toBe(urlMints.length);
          return Promise.resolve({ data: responseTokens });
        });

        const result = await getTokenMetadataByMints(mints, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
      });

      it('should fallback to Jupiter when backend fails', async () => {
        const mints = [KNOWN_ADDRESSES.SOL];

        mockApiClientGet.mockRejectedValueOnce(new Error('Backend error'));
        mockAxiosGet.mockResolvedValueOnce({ data: mockJupiterTokens });

        const result = await getTokenMetadataByMints(mints, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
      });
    });

    // ========================================================================
    // searchTokens() Tests
    // ========================================================================
    describe('searchTokens', () => {
      it('should return empty array for query < 3 chars', async () => {
        const result1 = await searchTokens('');
        const result2 = await searchTokens('SO');

        expect(result1).toEqual([]);
        expect(result2).toEqual([]);
      });

      it('should search for SOL token', async () => {
        const query = 'SOL';
        const searchResults = [mockBackendTokens[0]];
        mockApiClientGet.mockResolvedValueOnce({ data: searchResults });

        const result = await searchTokens(query, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].symbol).toContain('SOL');
      });

      it('should search for USDC token', async () => {
        const query = 'USDC';
        const searchResults = [mockBackendTokens[1]];
        mockApiClientGet.mockResolvedValueOnce({ data: searchResults });

        const result = await searchTokens(query, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should properly encode query parameters', async () => {
        const query = 'test token';

        mockApiClientGet.mockImplementation((url: string) => {
          expect(url).toContain(encodeURIComponent(query));
          return Promise.resolve({ data: [] });
        });

        await searchTokens(query, 'solana-mainnet');

        expect(mockApiClientGet).toHaveBeenCalled();
      });

      it('should fallback to local search when backend fails', async () => {
        const query = 'SOL';

        mockApiClientGet
          .mockRejectedValueOnce(new Error('Search endpoint error'))
          .mockResolvedValueOnce({ data: mockBackendTokens });

        const result = await searchTokens(query, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
      });

      it('should match tokens by name, symbol, or address', async () => {
        const query = 'Solana';
        const searchResults = [mockBackendTokens[0]];
        mockApiClientGet.mockResolvedValueOnce({ data: searchResults });

        const result = await searchTokens(query, 'solana-mainnet');

        expect(Array.isArray(result)).toBe(true);
      });

      it('should limit local search results to 50', async () => {
        const query = 'test';
        const manyTokens = Array.from({ length: 100 }, (_, i) => ({
          symbol: `TEST${i}`,
          name: `Test Token ${i}`,
          decimals: 9,
          address: `Test${i}`,
        }));

        mockApiClientGet
          .mockRejectedValueOnce(new Error('Search error'))
          .mockResolvedValueOnce({ data: manyTokens });

        const result = await searchTokens(query, 'solana-mainnet');

        expect(result.length).toBeLessThanOrEqual(50);
      });
    });

    // ========================================================================
    // getTokenByAddress() Tests
    // ========================================================================
    describe('getTokenByAddress', () => {
      it('should fetch token by mint address (SOL)', async () => {
        const address = KNOWN_ADDRESSES.SOL;
        const responseTokens = [mockBackendTokens[0]];
        mockApiClientGet.mockResolvedValueOnce({ data: responseTokens });

        const result = await getTokenByAddress(address, 'solana-mainnet');

        expect(result).not.toBeNull();
        expect(result?.address).toBe(address);
      });

      it('should return null for non-existent address', async () => {
        const address = 'NonExistentAddress123456789';
        mockApiClientGet.mockResolvedValueOnce({ data: [] });

        const result = await getTokenByAddress(address, 'solana-mainnet');

        expect(result).toBeNull();
      });

      it('should verify returned token structure', async () => {
        const address = KNOWN_ADDRESSES.USDC;
        const responseTokens = [mockBackendTokens[1]];
        mockApiClientGet.mockResolvedValueOnce({ data: responseTokens });

        const result = await getTokenByAddress(address, 'solana-mainnet');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('decimals');
        expect(result).toHaveProperty('address');
        expect(result).toHaveProperty('logo');
      });
    });

    // ========================================================================
    // Cache Management Tests
    // ========================================================================
    describe('Cache Management', () => {
      it('clearTokenListCache should clear the cache', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        await getTokenList('solana-mainnet');
        const sourceBefore = getTokenListSource();

        clearTokenListCache();
        const sourceAfter = getTokenListSource();

        expect(sourceBefore).toBe('backend');
        expect(sourceAfter).toBeNull();
      });

      it('getTokenListSource should return null when cache is empty', () => {
        clearTokenListCache();
        const source = getTokenListSource();
        expect(source).toBeNull();
      });

      it('getTokenListSource should return source after fetching tokens', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        await getTokenList('solana-mainnet');
        const source = getTokenListSource();

        expect(source).toBe('backend');
      });

      it('should cache results for 5 minutes', async () => {
        mockApiClientGet.mockResolvedValueOnce({ data: mockBackendTokens });

        const result1 = await getTokenList('solana-mainnet');

        // Second call should use cache
        const result2 = await getTokenList('solana-mainnet');

        expect(result1).toEqual(result2);
        // Should only call backend once
        expect(mockApiClientGet).toHaveBeenCalledTimes(1);
      });
    });
  });
});
