/**
 * Price Service Tests
 * Tests for price service functions including cache behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getReachableBackendBaseUrl } from '../test-backend';

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
    staticApiClient: {
      get: vi.fn(),
    },
    ApiError: class ApiError extends Error {
      status: number;
      code?: string;
      details?: Record<string, unknown>;
      originalError?: unknown;

      constructor(
        message: string,
        status: number,
        code?: string,
        details?: Record<string, unknown>,
        originalError?: unknown
      ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.originalError = originalError;
      }

      isNotFound(): boolean {
        return this.status === 404;
      }
    },
  };
});

// Now import the functions AFTER mocking
import {
  getPricesByPlatform,
  getPricesByIds,
  getMarketChart,
  getCoinInfo,
  clearPriceCache,
  getPriceCacheStatus,
} from './price';
import type {
  TokenPrice,
  MarketChartData,
  CoinInfo,
} from '../../types/price';
import { apiClient, staticApiClient, ApiError } from '../client';

// Get access to the mocked functions
const mockApiClientGet = vi.mocked(apiClient.get);
const mockStaticApiClientGet = vi.mocked(staticApiClient.get);

// ============================================================================
// Test Data
// ============================================================================

/**
 * Mock TokenPrice data
 */
const MOCK_SOLANA_PRICES: TokenPrice[] = [
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    usdPrice: 100.5,
    perc24HoursChange: 5.2,
    market_cap: 45000000000,
    market_cap_rank: 5,
    total_volume: 2500000000,
    high_24h: 105.2,
    low_24h: 95.8,
    price_change_24h: 4.95,
    circulating_supply: 447615274,
    total_supply: 550000000,
    max_supply: null,
    ath: 260.06,
    ath_change_percentage: -61.35,
    ath_date: '2021-11-06T00:00:00.000Z',
    atl: 0.500801,
    atl_change_percentage: 19962.65,
    atl_date: '2020-05-11T00:00:00.000Z',
    last_updated: '2024-01-01T00:00:00.000Z',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  },
  {
    id: 'usd-coin',
    symbol: 'usdc',
    name: 'USD Coin',
    usdPrice: 1.0,
    perc24HoursChange: 0.01,
    market_cap: 25000000000,
    market_cap_rank: 6,
    total_volume: 5000000000,
    high_24h: 1.001,
    low_24h: 0.999,
    circulating_supply: 25000000000,
  },
  {
    id: 'bonk',
    symbol: 'bonk',
    name: 'Bonk',
    usdPrice: 0.00002145,
    perc24HoursChange: -12.5,
    market_cap: 1500000000,
    market_cap_rank: 75,
    total_volume: 350000000,
  },
];

const MOCK_BITCOIN_PRICES: TokenPrice[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    usdPrice: 45000.0,
    perc24HoursChange: 2.5,
    market_cap: 880000000000,
    market_cap_rank: 1,
  },
  {
    id: 'wrapped-bitcoin',
    symbol: 'wbtc',
    name: 'Wrapped Bitcoin',
    usdPrice: 44980.0,
    perc24HoursChange: 2.48,
  },
];

const MOCK_ETHEREUM_PRICES: TokenPrice[] = [
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    usdPrice: 2500.0,
    perc24HoursChange: 3.2,
    market_cap: 300000000000,
    market_cap_rank: 2,
  },
];

/**
 * Mock MarketChartData
 */
const MOCK_MARKET_CHART: MarketChartData = {
  prices: [
    [1704067200000, 100.5],
    [1704153600000, 102.3],
    [1704240000000, 101.8],
    [1704326400000, 103.5],
    [1704412800000, 105.2],
  ],
  market_caps: [
    [1704067200000, 45000000000],
    [1704153600000, 45800000000],
    [1704240000000, 45600000000],
    [1704326400000, 46300000000],
    [1704412800000, 47100000000],
  ],
  total_volumes: [
    [1704067200000, 2500000000],
    [1704153600000, 2600000000],
    [1704240000000, 2550000000],
    [1704326400000, 2700000000],
    [1704412800000, 2800000000],
  ],
};

/**
 * Mock CoinInfo data
 */
const MOCK_COIN_INFO: CoinInfo = {
  id: 'solana',
  symbol: 'sol',
  name: 'Solana',
  description: 'Solana is a highly functional open source project that banks on blockchain technology.',
  image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  marketData: {
    currentPrice: 100.5,
    marketCap: 45000000000,
    totalVolume: 2500000000,
    high24h: 105.2,
    low24h: 95.8,
    priceChange24h: 4.95,
    priceChangePercentage24h: 5.2,
    circulatingSupply: 447615274,
    totalSupply: 550000000,
    maxSupply: null,
    ath: 260.06,
    athChangePercentage: -61.35,
    athDate: '2021-11-06T21:54:35.825Z',
    atl: 0.500801,
    atlChangePercentage: 19961.42,
    atlDate: '2020-05-11T19:35:23.449Z',
  },
  links: {
    homepage: ['https://solana.com'],
    blockchainSite: ['https://solscan.io', 'https://explorer.solana.com'],
    twitterScreenName: 'solana',
  },
  categories: ['Smart Contract Platform', 'Layer 1'],
  genesisDate: '2020-03-16',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if backend is available
 */
const backendBaseUrl = await getReachableBackendBaseUrl();
const hasExplicitStaticApi =
  !!process.env.EXPO_PUBLIC_STATIC_API_URL || !!process.env.VITE_STATIC_API_URL;

async function fetchBackendJson<T>(path: string): Promise<T> {
  if (!backendBaseUrl) {
    throw new Error('Backend not available');
  }

  const response = await fetch(`${backendBaseUrl}${path}`, {
    method: 'GET',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Tests
// ============================================================================

describe('Price Service', () => {
  beforeEach(() => {
    // Clear cache and all mocks before each test
    clearPriceCache();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // getPricesByPlatform Tests
  // ==========================================================================

  describe('getPricesByPlatform', () => {
    it('should fetch prices for solana platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByPlatform('solana');

      expect(result).toEqual(MOCK_SOLANA_PRICES);
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/solana');
    });

    it('should fetch prices for bitcoin platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

      const result = await getPricesByPlatform('bitcoin');

      expect(result).toEqual(MOCK_BITCOIN_PRICES);
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/bitcoin');
    });

    it('should fetch prices for ethereum platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_ETHEREUM_PRICES });

      const result = await getPricesByPlatform('ethereum');

      expect(result).toEqual(MOCK_ETHEREUM_PRICES);
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/ethereum');
    });

    it('should cache prices and return from cache on second call', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result1 = await getPricesByPlatform('solana');
      const result2 = await getPricesByPlatform('solana');

      expect(result1).toEqual(result2);
      expect(mockStaticApiClientGet).toHaveBeenCalledTimes(1);
    });

    it('should cache prices separately per platform', async () => {
      mockStaticApiClientGet
        .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
        .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

      const solanaResult = await getPricesByPlatform('solana');
      const bitcoinResult = await getPricesByPlatform('bitcoin');

      expect(solanaResult).toEqual(MOCK_SOLANA_PRICES);
      expect(bitcoinResult).toEqual(MOCK_BITCOIN_PRICES);
      expect(mockStaticApiClientGet).toHaveBeenCalledTimes(2);
      expect(mockStaticApiClientGet).toHaveBeenNthCalledWith(1, '/v1/coins/solana');
      expect(mockStaticApiClientGet).toHaveBeenNthCalledWith(2, '/v1/coins/bitcoin');
    });

    it('should return null when API returns non-array data', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: { error: 'Invalid data' } });

      const result = await getPricesByPlatform('solana');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      mockStaticApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await getPricesByPlatform('solana');

      expect(result).toBeNull();
    });

    it('should return null when API returns null', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: null });

      const result = await getPricesByPlatform('solana');

      expect(result).toBeNull();
    });

    it('should verify returned price structure', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByPlatform('solana');

      expect(result).not.toBeNull();
      expect(result![0]).toHaveProperty('id');
      expect(result![0]).toHaveProperty('symbol');
      expect(result![0]).toHaveProperty('name');
      expect(result![0]).toHaveProperty('usdPrice');
      expect(result![0]).toHaveProperty('perc24HoursChange');
    });

    it('should handle ethereum platform', async () => {
      const mockEthereumPrices: TokenPrice[] = [
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          usdPrice: 3000,
          perc24HoursChange: 1.5,
        },
      ];

      mockStaticApiClientGet.mockResolvedValueOnce({ data: mockEthereumPrices });

      const result = await getPricesByPlatform('ethereum');

      expect(result).toEqual(mockEthereumPrices);
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/ethereum');
    });
  });

  // ==========================================================================
  // getPricesByIds Tests
  // ==========================================================================

  describe('getPricesByIds', () => {
    it('should return prices filtered by IDs', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds(['solana', 'usd-coin']);

      expect(result).toHaveLength(2);
      expect(result![0].id).toBe('solana');
      expect(result![1].id).toBe('usd-coin');
    });

    it('should handle single ID', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds(['bonk']);

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('bonk');
    });

    it('should return empty array for non-existent IDs', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds(['non-existent-coin']);

      expect(result).toEqual([]);
    });

    it('should be case-insensitive when matching IDs', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds(['SOLANA', 'USD-COIN']);

      expect(result).toHaveLength(2);
    });

    it('should use specified platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

      const result = await getPricesByIds(['bitcoin'], 'bitcoin');

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('bitcoin');
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/bitcoin');
    });

    it('should default to solana platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      await getPricesByIds(['solana']);

      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/solana');
    });

    it('should return null when getPricesByPlatform fails', async () => {
      mockStaticApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await getPricesByIds(['solana']);

      expect(result).toBeNull();
    });

    it('should handle empty IDs array', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds([]);

      expect(result).toEqual([]);
    });

    it('should deduplicate IDs', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await getPricesByIds(['solana', 'solana', 'SOLANA']);

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('solana');
    });
  });

  // ==========================================================================
  // getMarketChart Tests
  // ==========================================================================

  describe('getMarketChart', () => {
    it('should fetch market chart for a coin', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      const result = await getMarketChart('solana');

      expect(result).toEqual(MOCK_MARKET_CHART);
      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/chart/solana', {
        params: { days: 7, currency: 'usd' },
      });
    });

    it('should use default days (7) and currency (usd)', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      await getMarketChart('bitcoin');

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/chart/bitcoin', {
        params: { days: 7, currency: 'usd' },
      });
    });

    it('should accept custom days parameter', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      await getMarketChart('ethereum', 30);

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/chart/ethereum', {
        params: { days: 30, currency: 'usd' },
      });
    });

    it('should accept custom currency parameter', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      await getMarketChart('solana', 7, 'eur');

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/chart/solana', {
        params: { days: 7, currency: 'eur' },
      });
    });

    it('should support all valid days values', async () => {
      const validDays: Array<1 | 7 | 30 | 90 | 365> = [1, 7, 30, 90, 365];

      for (const days of validDays) {
        mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });
        await getMarketChart('solana', days);
        expect(mockApiClientGet).toHaveBeenLastCalledWith('/v1/chart/solana', {
          params: { days, currency: 'usd' },
        });
      }
    });

    it('should return null on API error', async () => {
      mockApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await getMarketChart('solana');

      expect(result).toBeNull();
    });

    it('should verify chart data structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      const result = await getMarketChart('solana');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('prices');
      expect(result).toHaveProperty('market_caps');
      expect(result).toHaveProperty('total_volumes');
      expect(Array.isArray(result!.prices)).toBe(true);
      expect(Array.isArray(result!.market_caps)).toBe(true);
      expect(Array.isArray(result!.total_volumes)).toBe(true);
    });

    it('should verify data point structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_MARKET_CHART });

      const result = await getMarketChart('solana');

      expect(result!.prices.length).toBeGreaterThan(0);
      expect(result!.prices[0]).toHaveLength(2);
      expect(typeof result!.prices[0][0]).toBe('number'); // timestamp
      expect(typeof result!.prices[0][1]).toBe('number'); // price
    });
  });

  // ==========================================================================
  // getCoinInfo Tests
  // ==========================================================================

  describe('getCoinInfo', () => {
    it('should fetch coin info for a coin', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      const result = await getCoinInfo('solana');

      expect(result).toEqual(MOCK_COIN_INFO);
      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/coin/solana', {
        params: { currency: 'usd' },
      });
    });

    it('should use default currency (usd)', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      await getCoinInfo('bitcoin');

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/coin/bitcoin', {
        params: { currency: 'usd' },
      });
    });

    it('should accept custom currency parameter', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      await getCoinInfo('ethereum', 'eur');

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/coin/ethereum', {
        params: { currency: 'eur' },
      });
    });

    it('should return null on API error', async () => {
      mockApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await getCoinInfo('solana');

      expect(result).toBeNull();
    });

    it('should verify coin info structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      const result = await getCoinInfo('solana');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('marketData');
      expect(result).toHaveProperty('image');
    });

    it('should verify market data structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      const result = await getCoinInfo('solana');

      expect(result!.marketData).toBeDefined();
      expect(result!.marketData?.currentPrice).toBeDefined();
      expect(result!.marketData?.marketCap).toBeDefined();
      expect(result!.marketData?.totalVolume).toBeDefined();
    });

    it('should handle coin without optional fields', async () => {
      const minimalCoinInfo: CoinInfo = {
        id: 'minimal-coin',
        symbol: 'min',
        name: 'Minimal Coin',
      };

      mockApiClientGet.mockResolvedValueOnce({ data: minimalCoinInfo });

      const result = await getCoinInfo('minimal-coin');

      expect(result).toEqual(minimalCoinInfo);
      expect(result!.description).toBeUndefined();
      expect(result!.image).toBeUndefined();
      expect(result!.marketData).toBeUndefined();
    });
  });

  // ==========================================================================
  // Cache Management Tests
  // ==========================================================================

  describe('Cache Management', () => {
    describe('clearPriceCache', () => {
      it('should clear cache for specific platform', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');
        clearPriceCache('solana');
        await getPricesByPlatform('solana');

        expect(mockStaticApiClientGet).toHaveBeenCalledTimes(2);
      });

      it('should clear cache for all platforms when no platform specified', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES })
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');
        clearPriceCache();
        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');

        expect(mockStaticApiClientGet).toHaveBeenCalledTimes(4);
      });

      it('should only clear specified platform cache', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES })
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');
        clearPriceCache('solana');
        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');

        // Solana should be called twice (before and after clear)
        // Bitcoin should use cache (called once)
        expect(mockStaticApiClientGet).toHaveBeenCalledTimes(3);
      });
    });

    describe('getPriceCacheStatus', () => {
      it('should return empty status when cache is empty', () => {
        const status = getPriceCacheStatus();

        expect(status.entries).toBe(0);
      });

      it('should return status with cached platforms', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');

        const status = getPriceCacheStatus();

        expect(status.entries).toBe(2);
      });

      it('should update status after clearing cache', async () => {
        mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');
        clearPriceCache('solana');

        const status = getPriceCacheStatus();

        expect(status.entries).toBe(0);
      });

      it('should update status after clearing all caches', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');
        clearPriceCache();

        const status = getPriceCacheStatus();

        expect(status.entries).toBe(0);
      });
    });

    describe('Cache TTL', () => {
      it('should use cache within TTL window (5 minutes)', async () => {
        mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('solana');

        expect(mockStaticApiClientGet).toHaveBeenCalledTimes(1);
      });

      it('should expire cache after TTL (mocked with timer)', async () => {
        vi.useFakeTimers();

        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');

        // Advance time by 301 seconds (past 300 second TTL)
        vi.advanceTimersByTime(301000);

        await getPricesByPlatform('solana');

        expect(mockStaticApiClientGet).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
      });
    });
  });

  // ==========================================================================
  // Integration Tests (with real backend if available)
  // ==========================================================================

  describe('Integration with backend (if available)', () => {
    it(
      'should fetch real Solana prices from backend',
      async () => {
        if (!backendBaseUrl) {
          console.log('Skipping backend integration test - backend not available');
          return;
        }
        if (!hasExplicitStaticApi) {
          console.log('Skipping price integration test - static API URL is not configured');
          return;
        }

        mockStaticApiClientGet.mockImplementation(async (path) => ({
          data: await fetchBackendJson(path as string),
        }));

        const result = await getPricesByPlatform('solana');

        expect(result).not.toBeNull();
        expect(Array.isArray(result)).toBe(true);
        expect(result!.length).toBeGreaterThan(0);

        // Verify structure
        const solPrice = result!.find((p) => p.id === 'solana' || p.symbol.toLowerCase() === 'sol');
        expect(solPrice).toBeDefined();
        expect(solPrice!.usdPrice).toBeGreaterThan(0);
        expect(typeof solPrice!.perc24HoursChange).toBe('number');
      },
      10000 // 10 second timeout
    );

    it(
      'should fetch real market chart from backend',
      async () => {
        if (!backendBaseUrl) {
          console.log('Skipping backend integration test - backend not available');
          return;
        }
        if (!hasExplicitStaticApi) {
          console.log('Skipping price integration test - static API URL is not configured');
          return;
        }

        mockStaticApiClientGet.mockImplementation(async (path) => ({
          data: await fetchBackendJson(path as string),
        }));

        const result = await getMarketChart('solana', 7);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('prices');
        expect(Array.isArray(result!.prices)).toBe(true);
        expect(result!.prices.length).toBeGreaterThan(0);
      },
      10000
    );
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty array response', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: [] });

      const result = await getPricesByPlatform('solana');

      expect(result).toEqual([]);
    });

    it('should handle malformed price data', async () => {
      const malformedData = [
        {
          id: 'token1',
          // missing required fields
        },
      ];

      mockStaticApiClientGet.mockResolvedValueOnce({ data: malformedData });

      const result = await getPricesByPlatform('solana');

      expect(result).toEqual(malformedData); // Should still return the data as-is
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      mockApiClientGet.mockRejectedValueOnce(timeoutError);

      const result = await getMarketChart('solana');

      expect(result).toBeNull();
    });

    it('should handle server errors (500)', async () => {
      const serverError = new ApiError('Internal server error', 500, 'SERVER_ERROR');
      mockStaticApiClientGet.mockRejectedValueOnce(serverError);

      const result = await getPricesByPlatform('solana');

      expect(result).toBeNull();
    });
  });
});
