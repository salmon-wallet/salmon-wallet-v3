/**
 * Price Service Tests
 * Tests for price service functions including cache behavior
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
  getTopTokensByPlatform,
  getSolanaTokenPrice,
  getMarketChart,
  getCoinInfo,
  findTokenPrice,
  clearPriceCache,
  getPriceCacheStatus,
  type TokenPrice,
  type TopToken,
  type MarketChartData,
  type CoinInfo,
  type PricePlatform,
  type NetworkId,
} from './price';
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
    current_price: 100.5,
    price_change_percentage_24h: 5.2,
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
    current_price: 1.0,
    price_change_percentage_24h: 0.01,
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
    current_price: 0.00002145,
    price_change_percentage_24h: -12.5,
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
    current_price: 45000.0,
    price_change_percentage_24h: 2.5,
    market_cap: 880000000000,
    market_cap_rank: 1,
  },
  {
    id: 'wrapped-bitcoin',
    symbol: 'wbtc',
    name: 'Wrapped Bitcoin',
    current_price: 44980.0,
    price_change_percentage_24h: 2.48,
  },
];

const MOCK_ETHEREUM_PRICES: TokenPrice[] = [
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2500.0,
    price_change_percentage_24h: 3.2,
    market_cap: 300000000000,
    market_cap_rank: 2,
  },
];

/**
 * Mock TopToken data
 */
const MOCK_TOP_TOKENS: TopToken[] = [
  {
    id: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    price: 100.5,
    priceChange24h: 5.2,
    volume24h: 2500000000,
    marketCap: 45000000000,
    tags: ['verified', 'strict'],
    coingeckoId: 'solana',
  },
  {
    id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    price: 1.0,
    priceChange24h: 0.01,
    volume24h: 5000000000,
    marketCap: 25000000000,
    coingeckoId: 'usd-coin',
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
  description: {
    en: 'Solana is a highly functional open source project that banks on blockchain technology.',
  },
  image: {
    thumb: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
    small: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    large: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  },
  market_data: {
    current_price: { usd: 100.5 },
    market_cap: { usd: 45000000000 },
    total_volume: { usd: 2500000000 },
    high_24h: { usd: 105.2 },
    low_24h: { usd: 95.8 },
    price_change_24h: 4.95,
    price_change_percentage_24h: 5.2,
    circulating_supply: 447615274,
    total_supply: 550000000,
    max_supply: null,
    ath: { usd: 260.06 },
    atl: { usd: 0.500801 },
  },
  links: {
    homepage: ['https://solana.com'],
    blockchain_site: ['https://solscan.io', 'https://explorer.solana.com'],
    twitter_screen_name: 'solana',
  },
  categories: ['Smart Contract Platform', 'Layer 1'],
  genesis_date: '2020-03-16',
};

// Known test addresses
const KNOWN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if backend is available
 */
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/health', {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
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
      expect(result![0]).toHaveProperty('current_price');
      expect(result![0]).toHaveProperty('price_change_percentage_24h');
    });

    it('should handle eclipse platform', async () => {
      const mockEclipsePrices: TokenPrice[] = [
        {
          id: 'eclipse-token',
          symbol: 'ecl',
          name: 'Eclipse',
          current_price: 5.0,
          price_change_percentage_24h: 1.5,
        },
      ];

      mockStaticApiClientGet.mockResolvedValueOnce({ data: mockEclipsePrices });

      const result = await getPricesByPlatform('eclipse');

      expect(result).toEqual(mockEclipsePrices);
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/eclipse');
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
  // getTopTokensByPlatform Tests
  // ==========================================================================

  describe('getTopTokensByPlatform', () => {
    it('should fetch top tokens for solana', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TOP_TOKENS });

      const result = await getTopTokensByPlatform('solana');

      expect(result).toEqual(MOCK_TOP_TOKENS);
      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/top-tokens', {
        params: { platform: 'solana' },
      });
    });

    it('should fetch top tokens for ethereum', async () => {
      const mockEthTopTokens: TopToken[] = [
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: 2500.0,
          priceChange24h: 3.2,
          volume24h: 15000000000,
          marketCap: 300000000000,
        },
      ];

      mockApiClientGet.mockResolvedValueOnce({ data: mockEthTopTokens });

      const result = await getTopTokensByPlatform('ethereum');

      expect(result).toEqual(mockEthTopTokens);
      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/top-tokens', {
        params: { platform: 'ethereum' },
      });
    });

    it('should return empty array on API error', async () => {
      mockApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await getTopTokensByPlatform('solana');

      expect(result).toEqual([]);
    });

    it('should return empty array when API returns null', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: null });

      const result = await getTopTokensByPlatform('solana');

      expect(result).toEqual([]);
    });

    it('should verify returned token structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TOP_TOKENS });

      const result = await getTopTokensByPlatform('solana');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('symbol');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('price');
      expect(result[0]).toHaveProperty('address');
    });

    it('should handle tokens with optional fields', async () => {
      const tokensWithOptionals: TopToken[] = [
        {
          id: 'token1',
          symbol: 'TK1',
          name: 'Token 1',
          logo: 'https://example.com/logo.png',
          decimals: 9,
          tags: ['verified'],
        },
      ];

      mockApiClientGet.mockResolvedValueOnce({ data: tokensWithOptionals });

      const result = await getTopTokensByPlatform('solana');

      expect(result[0].logo).toBe('https://example.com/logo.png');
      expect(result[0].decimals).toBe(9);
      expect(result[0].tags).toEqual(['verified']);
    });
  });

  // ==========================================================================
  // getSolanaTokenPrice Tests
  // ==========================================================================

  describe('getSolanaTokenPrice', () => {
    it('should fetch price for a valid Solana token', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 100.5 } });

      const result = await getSolanaTokenPrice(KNOWN_MINTS.SOL);

      expect(result).toBe(100.5);
      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/ft/price/' + KNOWN_MINTS.SOL);
    });

    it('should use default network ID (solana-mainnet)', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 1.0 } });

      await getSolanaTokenPrice(KNOWN_MINTS.USDC);

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/ft/price/' + KNOWN_MINTS.USDC);
    });

    it('should use specified network ID', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 1.0 } });

      await getSolanaTokenPrice(KNOWN_MINTS.USDC, 'solana-devnet');

      expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-devnet/ft/price/' + KNOWN_MINTS.USDC);
    });

    it('should return null when token price not found (404)', async () => {
      const notFoundError = new ApiError('Token not found', 404, 'NOT_FOUND');
      mockApiClientGet.mockRejectedValueOnce(notFoundError);

      const result = await getSolanaTokenPrice('UnknownMint111111111111111111111111111111');

      expect(result).toBeNull();
    });

    it('should return null when API returns undefined usdPrice', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: {} });

      const result = await getSolanaTokenPrice(KNOWN_MINTS.SOL);

      expect(result).toBeNull();
    });

    it('should return null on API error (non-404)', async () => {
      mockApiClientGet.mockRejectedValueOnce(new Error('Server error'));

      const result = await getSolanaTokenPrice(KNOWN_MINTS.SOL);

      expect(result).toBeNull();
    });

    it('should handle zero price', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 0 } });

      const result = await getSolanaTokenPrice('ZeroPrice1111111111111111111111111111111');

      expect(result).toBe(0);
    });

    it('should handle very small prices', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 0.00000001 } });

      const result = await getSolanaTokenPrice('TinyPrice1111111111111111111111111111111');

      expect(result).toBe(0.00000001);
    });

    it('should handle large prices', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: { usdPrice: 999999.99 } });

      const result = await getSolanaTokenPrice('ExpensiveToken111111111111111111111111');

      expect(result).toBe(999999.99);
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
      expect(result).toHaveProperty('market_data');
      expect(result).toHaveProperty('image');
    });

    it('should verify market data structure', async () => {
      mockApiClientGet.mockResolvedValueOnce({ data: MOCK_COIN_INFO });

      const result = await getCoinInfo('solana');

      expect(result!.market_data).toBeDefined();
      expect(result!.market_data?.current_price).toBeDefined();
      expect(result!.market_data?.market_cap).toBeDefined();
      expect(result!.market_data?.total_volume).toBeDefined();
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
      expect(result!.market_data).toBeUndefined();
    });
  });

  // ==========================================================================
  // findTokenPrice Tests
  // ==========================================================================

  describe('findTokenPrice', () => {
    it('should find token by exact ID match', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('solana');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('solana');
      expect(result!.current_price).toBe(100.5);
    });

    it('should find token by symbol', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('sol');

      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('sol');
      expect(result!.id).toBe('solana');
    });

    it('should be case-insensitive when searching', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('SOLANA');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('solana');
    });

    it('should prioritize ID match over symbol match', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('usd-coin');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('usd-coin');
      expect(result!.symbol).toBe('usdc');
    });

    it('should return null for non-existent token', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('non-existent-token');

      expect(result).toBeNull();
    });

    it('should use specified platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

      const result = await findTokenPrice('bitcoin', 'bitcoin');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('bitcoin');
      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/bitcoin');
    });

    it('should default to solana platform', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      await findTokenPrice('sol');

      expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/coins/solana');
    });

    it('should return null when getPricesByPlatform fails', async () => {
      mockStaticApiClientGet.mockRejectedValueOnce(new Error('API error'));

      const result = await findTokenPrice('solana');

      expect(result).toBeNull();
    });

    it('should handle empty search string', async () => {
      mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

      const result = await findTokenPrice('');

      expect(result).toBeNull();
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

        expect(status.platforms).toEqual([]);
        expect(status.entries).toBe(0);
      });

      it('should return status with cached platforms', async () => {
        mockStaticApiClientGet
          .mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES })
          .mockResolvedValueOnce({ data: MOCK_BITCOIN_PRICES });

        await getPricesByPlatform('solana');
        await getPricesByPlatform('bitcoin');

        const status = getPriceCacheStatus();

        expect(status.platforms).toContain('solana');
        expect(status.platforms).toContain('bitcoin');
        expect(status.entries).toBe(2);
      });

      it('should update status after clearing cache', async () => {
        mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_PRICES });

        await getPricesByPlatform('solana');
        clearPriceCache('solana');

        const status = getPriceCacheStatus();

        expect(status.platforms).toEqual([]);
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

        expect(status.platforms).toEqual([]);
        expect(status.entries).toBe(0);
      });
    });

    describe('Cache TTL', () => {
      it('should use cache within TTL window (1 minute)', async () => {
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

        // Advance time by 61 seconds (past 60 second TTL)
        vi.advanceTimersByTime(61000);

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
        const backendAvailable = await isBackendAvailable();

        if (!backendAvailable) {
          console.log('Skipping backend integration test - backend not available at localhost:3000');
          return;
        }

        // This test runs only if backend is available
        const result = await getPricesByPlatform('solana');

        expect(result).not.toBeNull();
        expect(Array.isArray(result)).toBe(true);
        expect(result!.length).toBeGreaterThan(0);

        // Verify structure
        const solPrice = result!.find((p) => p.id === 'solana' || p.symbol.toLowerCase() === 'sol');
        expect(solPrice).toBeDefined();
        expect(solPrice!.current_price).toBeGreaterThan(0);
        expect(typeof solPrice!.price_change_percentage_24h).toBe('number');
      },
      10000 // 10 second timeout
    );

    it(
      'should fetch real top tokens from backend',
      async () => {
        const backendAvailable = await isBackendAvailable();

        if (!backendAvailable) {
          console.log('Skipping backend integration test - backend not available at localhost:3000');
          return;
        }

        const result = await getTopTokensByPlatform('solana');

        expect(result).not.toBeNull();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Verify structure
        expect(result[0]).toHaveProperty('symbol');
        expect(result[0]).toHaveProperty('name');
      },
      10000
    );

    it(
      'should fetch real market chart from backend',
      async () => {
        const backendAvailable = await isBackendAvailable();

        if (!backendAvailable) {
          console.log('Skipping backend integration test - backend not available at localhost:3000');
          return;
        }

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

    it('should handle rate limit errors', async () => {
      const rateLimitError = new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT');
      mockApiClientGet.mockRejectedValueOnce(rateLimitError);

      const result = await getTopTokensByPlatform('solana');

      expect(result).toEqual([]);
    });

    it('should handle server errors (500)', async () => {
      const serverError = new ApiError('Internal server error', 500, 'SERVER_ERROR');
      mockStaticApiClientGet.mockRejectedValueOnce(serverError);

      const result = await getPricesByPlatform('solana');

      expect(result).toBeNull();
    });
  });
});
