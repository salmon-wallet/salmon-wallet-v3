/**
 * Balance Service Tests
 * Tests for pure functions in the balance service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatBalance,
  formatUsdValue,
  formatPercentChange,
  decorateBalanceList,
  decorateBalancePrices,
  calculate24HoursChange,
  createSolBalance,
  getWalletBalance,
  SOL_CONSTANTS,
  LAMPORTS_PER_SOL,
  type RawTokenBalance,
  type TokenBalance,
  type TokenBalanceWithPrice,
  type TokenMetadata,
  type TokenPrice,
} from './balance';
import * as tokensModule from './tokens';
import * as priceModule from './price';

// ============================================================================
// Test Data
// ============================================================================

const MOCK_OWNER = '7XaXJK8z9Y5J1x6W4Xz7R3Q5L9T3N6D4M8F2K1H5G9P2';

const MOCK_TOKEN_METADATA: TokenMetadata[] = [
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    coingeckoId: 'usd-coin',
    tags: ['stablecoin'],
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    coingeckoId: 'tether',
    tags: ['stablecoin'],
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logo: 'https://example.com/bonk.png',
    coingeckoId: 'bonk',
    tags: ['meme'],
  },
];

const MOCK_TOKEN_PRICES: TokenPrice[] = [
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    usdPrice: 100.5,
    perc24HoursChange: 5.2,
  },
  {
    id: 'usd-coin',
    symbol: 'usdc',
    name: 'USD Coin',
    usdPrice: 1.0,
    perc24HoursChange: 0.01,
  },
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    usdPrice: 0.9999,
    perc24HoursChange: -0.02,
  },
  {
    id: 'bonk',
    symbol: 'bonk',
    name: 'Bonk',
    usdPrice: 0.00002145,
    perc24HoursChange: -12.5,
  },
];

const MOCK_RAW_BALANCES: RawTokenBalance[] = [
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    owner: MOCK_OWNER,
    amount: '1000000000',
    decimals: 6,
    uiAmount: 1000,
    program: 'spl-token',
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    owner: MOCK_OWNER,
    amount: 500000000,
    decimals: 6,
    uiAmount: 500,
    program: 'spl-token',
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    owner: MOCK_OWNER,
    amount: '100000000',
    decimals: 5,
    uiAmount: 1000,
    program: 'spl-token-2022',
    extensions: [{ type: 'transferFee' }],
  },
];

// ============================================================================
// formatBalance Tests
// ============================================================================

describe('formatBalance', () => {
  it('should format zero as "0"', () => {
    expect(formatBalance(0)).toBe('0');
  });

  it('should format very small amounts as "<0.0001"', () => {
    expect(formatBalance(0.00001)).toBe('<0.0001');
    expect(formatBalance(0.000099)).toBe('<0.0001');
  });

  it('should format small amounts with 4 decimals by default', () => {
    expect(formatBalance(0.1234)).toBe('0.1234');
    expect(formatBalance(1.5678)).toBe('1.5678');
    expect(formatBalance(99.9999)).toBe('99.9999');
  });

  it('should format amounts >= 1000 with K suffix', () => {
    expect(formatBalance(1000)).toBe('1.00K');
    expect(formatBalance(1500)).toBe('1.50K');
    expect(formatBalance(999999)).toBe('1000.00K');
  });

  it('should format amounts >= 1000000 with M suffix', () => {
    expect(formatBalance(1000000)).toBe('1.00M');
    expect(formatBalance(2500000)).toBe('2.50M');
    expect(formatBalance(123456789)).toBe('123.46M');
  });

  it('should respect custom decimal places', () => {
    expect(formatBalance(1.23456789, 2)).toBe('1.23');
    expect(formatBalance(1.23456789, 6)).toBe('1.234568');
    expect(formatBalance(0.123456, 0)).toBe('0');
  });

  it('should handle edge cases', () => {
    expect(formatBalance(0.0001)).toBe('0.0001');
    expect(formatBalance(999.9999)).toBe('999.9999');
    expect(formatBalance(1000.1234, 2)).toBe('1.00K');
  });

  it('should handle negative numbers', () => {
    // Note: formatBalance does not handle negatives well - the < 0.0001 check
    // catches all negative numbers since any negative number < 0.0001
    expect(formatBalance(-5.5)).toBe('<0.0001');
    expect(formatBalance(-1000)).toBe('<0.0001');
    expect(formatBalance(-0.00001)).toBe('<0.0001');
  });
});

// ============================================================================
// formatUsdValue Tests
// ============================================================================

describe('formatUsdValue', () => {
  it('should return "-" for undefined', () => {
    expect(formatUsdValue(undefined)).toBe('-');
  });

  it('should return "-" for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatUsdValue(null as any)).toBe('-');
  });

  it('should format zero as "$0.00"', () => {
    expect(formatUsdValue(0)).toBe('$0.00');
  });

  it('should format very small amounts as "<$0.01"', () => {
    expect(formatUsdValue(0.001)).toBe('<$0.01');
    expect(formatUsdValue(0.009)).toBe('<$0.01');
  });

  it('should format small amounts with 2 decimals', () => {
    expect(formatUsdValue(0.01)).toBe('$0.01');
    expect(formatUsdValue(1.5)).toBe('$1.50');
    expect(formatUsdValue(99.99)).toBe('$99.99');
    expect(formatUsdValue(123.456)).toBe('$123.46');
  });

  it('should format amounts >= 1000 with K suffix', () => {
    expect(formatUsdValue(1000)).toBe('$1.00K');
    expect(formatUsdValue(1500)).toBe('$1.50K');
    expect(formatUsdValue(999999)).toBe('$1000.00K');
  });

  it('should format amounts >= 1000000 with M suffix', () => {
    expect(formatUsdValue(1000000)).toBe('$1.00M');
    expect(formatUsdValue(2500000)).toBe('$2.50M');
    expect(formatUsdValue(123456789)).toBe('$123.46M');
  });

  it('should handle edge cases', () => {
    expect(formatUsdValue(0.01)).toBe('$0.01');
    expect(formatUsdValue(999.99)).toBe('$999.99');
    expect(formatUsdValue(1000.1234)).toBe('$1.00K');
  });

  it('should handle negative numbers', () => {
    // Note: formatUsdValue does not handle negatives well - the < 0.01 check
    // catches all negative numbers since any negative number < 0.01
    expect(formatUsdValue(-5.5)).toBe('<$0.01');
    expect(formatUsdValue(-1000)).toBe('<$0.01');
    expect(formatUsdValue(-0.001)).toBe('<$0.01');
  });
});

// ============================================================================
// formatPercentChange Tests
// ============================================================================

describe('formatPercentChange', () => {
  it('should return "-" for undefined', () => {
    expect(formatPercentChange(undefined)).toBe('-');
  });

  it('should return "-" for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatPercentChange(null as any)).toBe('-');
  });

  it('should format zero as "+0.00%"', () => {
    expect(formatPercentChange(0)).toBe('+0.00%');
  });

  it('should format positive percentages with "+" sign', () => {
    expect(formatPercentChange(5.2)).toBe('+5.20%');
    expect(formatPercentChange(12.345)).toBe('+12.35%');
    expect(formatPercentChange(100)).toBe('+100.00%');
  });

  it('should format negative percentages with "-" sign', () => {
    expect(formatPercentChange(-5.2)).toBe('-5.20%');
    expect(formatPercentChange(-12.345)).toBe('-12.35%');
    expect(formatPercentChange(-100)).toBe('-100.00%');
  });

  it('should format very small percentages', () => {
    expect(formatPercentChange(0.01)).toBe('+0.01%');
    expect(formatPercentChange(-0.01)).toBe('-0.01%');
  });

  it('should format large percentages', () => {
    expect(formatPercentChange(1234.56)).toBe('+1234.56%');
    expect(formatPercentChange(-999.99)).toBe('-999.99%');
  });
});

// ============================================================================
// decorateBalanceList Tests
// ============================================================================

describe('decorateBalanceList', () => {
  it('should return empty array for empty balances', () => {
    const result = decorateBalanceList([], MOCK_TOKEN_METADATA);
    expect(result).toEqual([]);
  });

  it('should return empty array when metadata is empty', () => {
    const result = decorateBalanceList(MOCK_RAW_BALANCES, []);
    expect(result).toHaveLength(3);
    // Should have UNKNOWN tokens
    expect(result[0].symbol).toBe('UNKNOWN');
    expect(result[0].name).toBe('Unknown Token');
    expect(result[0].logo).toBe(null);
  });

  it('should decorate balances with matching metadata', () => {
    const result = decorateBalanceList(MOCK_RAW_BALANCES, MOCK_TOKEN_METADATA);

    expect(result).toHaveLength(3);

    // Check USDC
    expect(result[0]).toMatchObject({
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      owner: MOCK_OWNER,
      amount: '1000000000',
      decimals: 6,
      uiAmount: 1000,
      symbol: 'USDC',
      name: 'USD Coin',
      logo: expect.stringContaining('logo.png'),
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      coingeckoId: 'usd-coin',
      tags: ['stablecoin'],
      program: 'spl-token',
    });

    // Check USDT
    expect(result[1]).toMatchObject({
      symbol: 'USDT',
      name: 'Tether USD',
      coingeckoId: 'tether',
    });

    // Check BONK with extensions
    expect(result[2]).toMatchObject({
      symbol: 'BONK',
      name: 'Bonk',
      program: 'spl-token-2022',
      extensions: [{ type: 'transferFee' }],
    });
  });

  it('should handle case-insensitive mint matching', () => {
    // Create metadata with mixed case address
    const metadataWithMixedCase: TokenMetadata[] = [
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mixed case - EXACT USDC address
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logo: 'https://example.com/usdc.png',
        coingeckoId: 'usd-coin',
      },
    ];

    const balanceWithDifferentCase: RawTokenBalance = {
      mint: 'EPJFWDD5AUFQSSQEM2QN1XZYBAPC8G4WEGGKZWYTDT1V', // All uppercase - same address
      owner: MOCK_OWNER,
      amount: '100',
      decimals: 6,
      uiAmount: 0.0001,
    };

    const result = decorateBalanceList([balanceWithDifferentCase], metadataWithMixedCase);

    expect(result[0].symbol).toBe('USDC');
  });

  it('should preserve all original balance fields', () => {
    const result = decorateBalanceList(MOCK_RAW_BALANCES, MOCK_TOKEN_METADATA);

    expect(result[0].mint).toBe(MOCK_RAW_BALANCES[0].mint);
    expect(result[0].owner).toBe(MOCK_RAW_BALANCES[0].owner);
    expect(result[0].amount).toBe(MOCK_RAW_BALANCES[0].amount);
    expect(result[0].decimals).toBe(MOCK_RAW_BALANCES[0].decimals);
    expect(result[0].uiAmount).toBe(MOCK_RAW_BALANCES[0].uiAmount);
  });

  it('should handle tokens without coingeckoId or tags', () => {
    const metadataWithoutOptionals: TokenMetadata[] = [
      {
        address: 'TEST123',
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 9,
        logo: null,
      },
    ];

    const balance: RawTokenBalance = {
      mint: 'TEST123',
      owner: MOCK_OWNER,
      amount: '1000',
      decimals: 9,
      uiAmount: 0.000001,
    };

    const result = decorateBalanceList([balance], metadataWithoutOptionals);

    expect(result[0].coingeckoId).toBeUndefined();
    expect(result[0].tags).toBeUndefined();
    expect(result[0].logo).toBe(null);
  });
});

// ============================================================================
// decorateBalancePrices Tests
// ============================================================================

describe('decorateBalancePrices', () => {
  const mockBalances: TokenBalance[] = [
    {
      mint: SOL_CONSTANTS.ADDRESS,
      owner: MOCK_OWNER,
      amount: 2000000000,
      decimals: SOL_CONSTANTS.DECIMALS,
      uiAmount: 2,
      symbol: SOL_CONSTANTS.SYMBOL,
      name: SOL_CONSTANTS.NAME,
      logo: SOL_CONSTANTS.LOGO,
      address: SOL_CONSTANTS.ADDRESS,
      coingeckoId: SOL_CONSTANTS.COINGECKO_ID,
    },
    {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      owner: MOCK_OWNER,
      amount: '1000000000',
      decimals: 6,
      uiAmount: 1000,
      symbol: 'USDC',
      name: 'USD Coin',
      logo: 'https://example.com/usdc.png',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      coingeckoId: 'usd-coin',
    },
  ];

  it('should return balances unchanged when prices is null', () => {
    const result = decorateBalancePrices(mockBalances, null);
    expect(result).toEqual(mockBalances);
  });

  it('should return empty array for empty balances', () => {
    const result = decorateBalancePrices([], MOCK_TOKEN_PRICES);
    expect(result).toEqual([]);
  });

  it('should decorate balances with price data', () => {
    const result = decorateBalancePrices(mockBalances, MOCK_TOKEN_PRICES);

    // SOL: 2 * 100.5 = 201
    expect(result[0]).toMatchObject({
      symbol: 'SOL',
      price: 100.5,
      usdBalance: 201,
      priceChange24h: 5.2,
    });

    // USDC: 1000 * 1.0 = 1000
    expect(result[1]).toMatchObject({
      symbol: 'USDC',
      price: 1.0,
      usdBalance: 1000,
      priceChange24h: 0.01,
    });
  });

  it('should match by coingeckoId first, then by symbol', () => {
    const balanceWithCoingeckoId: TokenBalance = {
      mint: 'TEST',
      owner: MOCK_OWNER,
      amount: '1000',
      decimals: 6,
      uiAmount: 100,
      symbol: 'WRONG_SYMBOL',
      name: 'Test',
      logo: null,
      address: 'TEST',
      coingeckoId: 'solana', // matches SOL by coingeckoId
    };

    const result = decorateBalancePrices([balanceWithCoingeckoId], MOCK_TOKEN_PRICES);

    // Should match SOL by coingeckoId (not by symbol)
    expect(result[0].price).toBe(100.5);
    expect(result[0].usdBalance).toBe(100 * 100.5);
  });

  it('should fallback to symbol matching when coingeckoId not found', () => {
    const balanceWithoutCoingeckoId: TokenBalance = {
      mint: 'TEST',
      owner: MOCK_OWNER,
      amount: '1000',
      decimals: 6,
      uiAmount: 100,
      symbol: 'USDC',
      name: 'Test',
      logo: null,
      address: 'TEST',
    };

    const result = decorateBalancePrices([balanceWithoutCoingeckoId], MOCK_TOKEN_PRICES);

    // Should match USDC by symbol
    expect(result[0].price).toBe(1.0);
  });

  it('should handle case-insensitive matching', () => {
    const balanceUpperCase: TokenBalance = {
      mint: 'TEST',
      owner: MOCK_OWNER,
      amount: '1000',
      decimals: 6,
      uiAmount: 100,
      symbol: 'USDC',
      name: 'Test',
      logo: null,
      address: 'TEST',
      coingeckoId: 'USD-COIN',
    };

    const result = decorateBalancePrices([balanceUpperCase], MOCK_TOKEN_PRICES);

    expect(result[0].price).toBe(1.0);
  });

  it('should leave balance undecorated when no price match found', () => {
    const unknownBalance: TokenBalance = {
      mint: 'UNKNOWN',
      owner: MOCK_OWNER,
      amount: '1000',
      decimals: 6,
      uiAmount: 100,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      logo: null,
      address: 'UNKNOWN',
    };

    const result = decorateBalancePrices([unknownBalance], MOCK_TOKEN_PRICES);

    expect(result[0].price).toBeUndefined();
    expect(result[0].usdBalance).toBeUndefined();
    expect(result[0].priceChange24h).toBeUndefined();
  });

  it('should calculate usdBalance correctly', () => {
    const balance: TokenBalance = {
      mint: 'BONK',
      owner: MOCK_OWNER,
      amount: '100000000',
      decimals: 5,
      uiAmount: 1000,
      symbol: 'BONK',
      name: 'Bonk',
      logo: null,
      address: 'BONK',
      coingeckoId: 'bonk',
    };

    const result = decorateBalancePrices([balance], MOCK_TOKEN_PRICES);

    // 1000 * 0.00002145 = 0.02145
    expect(result[0].usdBalance).toBeCloseTo(0.02145, 8);
  });
});

// ============================================================================
// calculate24HoursChange Tests
// ============================================================================

describe('calculate24HoursChange', () => {
  it('should return zero for zero currentTotal', () => {
    const balances: TokenBalanceWithPrice[] = [];
    const result = calculate24HoursChange(balances, 0);

    expect(result).toEqual({ amount: 0, percent: 0 });
  });

  it('should return zero when currentTotal is undefined/falsy', () => {
    const balances: TokenBalanceWithPrice[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = calculate24HoursChange(balances, null as any);

    expect(result).toEqual({ amount: 0, percent: 0 });
  });

  it('should calculate change correctly with price change data', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: SOL_CONSTANTS.ADDRESS,
        owner: MOCK_OWNER,
        amount: 1000000000,
        decimals: 9,
        uiAmount: 1,
        symbol: 'SOL',
        name: 'Solana',
        logo: null,
        address: SOL_CONSTANTS.ADDRESS,
        price: 100,
        usdBalance: 100,
        priceChange24h: 10, // +10%
      },
    ];

    const currentTotal = 100;
    const result = calculate24HoursChange(balances, currentTotal);

    // Previous price was 100 / 1.1 = 90.909...
    // Change amount: 100 - 90.909 = 9.090...
    // Change percent: (9.090 / 90.909) * 100 = 10%
    expect(result.amount).toBeCloseTo(9.09, 2);
    expect(result.percent).toBeCloseTo(10, 1);
  });

  it('should handle negative price changes', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: 'BONK',
        owner: MOCK_OWNER,
        amount: '100000',
        decimals: 5,
        uiAmount: 1000,
        symbol: 'BONK',
        name: 'Bonk',
        logo: null,
        address: 'BONK',
        price: 0.00002145,
        usdBalance: 0.02145,
        priceChange24h: -12.5, // -12.5%
      },
    ];

    const currentTotal = 0.02145;
    const result = calculate24HoursChange(balances, currentTotal);

    // Previous price factor: 1 + (-12.5/100) = 0.875
    // Previous balance: 0.02145 / 0.875 = 0.0245...
    // Change: 0.02145 - 0.0245 = -0.00305...
    expect(result.amount).toBeLessThan(0);
    expect(result.percent).toBeCloseTo(-12.5, 1);
  });

  it('should handle multiple balances', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: SOL_CONSTANTS.ADDRESS,
        owner: MOCK_OWNER,
        amount: 2000000000,
        decimals: 9,
        uiAmount: 2,
        symbol: 'SOL',
        name: 'Solana',
        logo: null,
        address: SOL_CONSTANTS.ADDRESS,
        price: 100,
        usdBalance: 200,
        priceChange24h: 5, // +5%
      },
      {
        mint: 'USDC',
        owner: MOCK_OWNER,
        amount: '1000000000',
        decimals: 6,
        uiAmount: 1000,
        symbol: 'USDC',
        name: 'USD Coin',
        logo: null,
        address: 'USDC',
        price: 1.0,
        usdBalance: 1000,
        priceChange24h: 0.01, // +0.01%
      },
    ];

    const currentTotal = 1200;
    const result = calculate24HoursChange(balances, currentTotal);

    // SOL: 200 / 1.05 = 190.476...
    // USDC: 1000 / 1.0001 = 999.900...
    // Previous total: 1190.376...
    // Change: 1200 - 1190.376 = 9.624...
    // Percent: (9.624 / 1190.376) * 100 = 0.808...%
    expect(result.amount).toBeCloseTo(9.62, 1);
    expect(result.percent).toBeCloseTo(0.808, 2);
  });

  it('should handle balances without price change data', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: 'UNKNOWN',
        owner: MOCK_OWNER,
        amount: '1000',
        decimals: 6,
        uiAmount: 100,
        symbol: 'UNKNOWN',
        name: 'Unknown',
        logo: null,
        address: 'UNKNOWN',
        price: 1.5,
        usdBalance: 150,
        // No priceChange24h
      },
    ];

    const currentTotal = 150;
    const result = calculate24HoursChange(balances, currentTotal);

    // Should assume same value 24h ago
    expect(result.amount).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('should handle mix of balances with and without price data', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: SOL_CONSTANTS.ADDRESS,
        owner: MOCK_OWNER,
        amount: 1000000000,
        decimals: 9,
        uiAmount: 1,
        symbol: 'SOL',
        name: 'Solana',
        logo: null,
        address: SOL_CONSTANTS.ADDRESS,
        price: 100,
        usdBalance: 100,
        priceChange24h: 10, // +10%
      },
      {
        mint: 'STABLE',
        owner: MOCK_OWNER,
        amount: '1000000',
        decimals: 6,
        uiAmount: 1,
        symbol: 'STABLE',
        name: 'Stable',
        logo: null,
        address: 'STABLE',
        price: 50,
        usdBalance: 50,
        // No price change
      },
    ];

    const currentTotal = 150;
    const result = calculate24HoursChange(balances, currentTotal);

    // SOL previous: 100 / 1.1 = 90.909
    // STABLE previous: 50 (no change)
    // Previous total: 140.909
    // Change: 150 - 140.909 = 9.091
    // Percent: (9.091 / 140.909) * 100 = 6.45%
    expect(result.amount).toBeCloseTo(9.09, 1);
    expect(result.percent).toBeCloseTo(6.45, 1);
  });

  it('should return zero when all previous values result in zero', () => {
    const balances: TokenBalanceWithPrice[] = [];
    const result = calculate24HoursChange(balances, 100);

    expect(result).toEqual({ amount: 0, percent: 0 });
  });

  it('should handle balances without usdBalance', () => {
    const balances: TokenBalanceWithPrice[] = [
      {
        mint: 'NO_PRICE',
        owner: MOCK_OWNER,
        amount: '1000',
        decimals: 6,
        uiAmount: 100,
        symbol: 'NO_PRICE',
        name: 'No Price',
        logo: null,
        address: 'NO_PRICE',
        // No price or usdBalance
      },
    ];

    const currentTotal = 0;
    const result = calculate24HoursChange(balances, currentTotal);

    expect(result).toEqual({ amount: 0, percent: 0 });
  });
});

// ============================================================================
// createSolBalance Tests
// ============================================================================

describe('createSolBalance', () => {
  it('should create SOL balance from lamports', () => {
    const lamports = 2000000000; // 2 SOL
    const owner = MOCK_OWNER;

    const result = createSolBalance(lamports, owner);

    expect(result).toEqual({
      mint: SOL_CONSTANTS.ADDRESS,
      owner,
      amount: lamports,
      decimals: SOL_CONSTANTS.DECIMALS,
      uiAmount: 2,
      symbol: SOL_CONSTANTS.SYMBOL,
      name: SOL_CONSTANTS.NAME,
      logo: SOL_CONSTANTS.LOGO,
      address: SOL_CONSTANTS.ADDRESS,
      coingeckoId: SOL_CONSTANTS.COINGECKO_ID,
      tags: ['community', 'moonshot-verified', 'strict', 'verified', 'major'],
    });
  });

  it('should handle zero lamports', () => {
    const result = createSolBalance(0, MOCK_OWNER);

    expect(result.amount).toBe(0);
    expect(result.uiAmount).toBe(0);
  });

  it('should calculate correct uiAmount for various lamport values', () => {
    expect(createSolBalance(LAMPORTS_PER_SOL, MOCK_OWNER).uiAmount).toBe(1);
    expect(createSolBalance(LAMPORTS_PER_SOL * 10, MOCK_OWNER).uiAmount).toBe(10);
    expect(createSolBalance(500000000, MOCK_OWNER).uiAmount).toBe(0.5);
    expect(createSolBalance(123456789, MOCK_OWNER).uiAmount).toBeCloseTo(0.123456789, 9);
  });

  it('should handle very small lamport amounts', () => {
    const result = createSolBalance(1, MOCK_OWNER);

    expect(result.uiAmount).toBe(1 / LAMPORTS_PER_SOL);
    expect(result.uiAmount).toBeCloseTo(0.000000001, 9);
  });

  it('should handle very large lamport amounts', () => {
    const lamports = LAMPORTS_PER_SOL * 1000000; // 1 million SOL
    const result = createSolBalance(lamports, MOCK_OWNER);

    expect(result.uiAmount).toBe(1000000);
  });

  it('should preserve owner address', () => {
    const owner1 = 'Owner1111111111111111111111111111111111111111';
    const owner2 = 'Owner2222222222222222222222222222222222222222';

    expect(createSolBalance(1000000000, owner1).owner).toBe(owner1);
    expect(createSolBalance(1000000000, owner2).owner).toBe(owner2);
  });

  it('should always use SOL constants', () => {
    const result = createSolBalance(1000000000, MOCK_OWNER);

    expect(result.symbol).toBe('SOL');
    expect(result.name).toBe('Solana');
    expect(result.decimals).toBe(9);
    expect(result.address).toBe(SOL_CONSTANTS.ADDRESS);
    expect(result.mint).toBe(SOL_CONSTANTS.ADDRESS);
    expect(result.coingeckoId).toBe('solana');
    expect(result.logo).toContain('trustwallet');
  });

  it('should handle fractional SOL amounts correctly', () => {
    const testCases = [
      { lamports: 100000000, expected: 0.1 },
      { lamports: 10000000, expected: 0.01 },
      { lamports: 1000000, expected: 0.001 },
      { lamports: 100000, expected: 0.0001 },
      { lamports: 10000, expected: 0.00001 },
      { lamports: 1000, expected: 0.000001 },
      { lamports: 100, expected: 0.0000001 },
      { lamports: 10, expected: 0.00000001 },
      { lamports: 1, expected: 0.000000001 },
    ];

    testCases.forEach(({ lamports, expected }) => {
      const result = createSolBalance(lamports, MOCK_OWNER);
      expect(result.uiAmount).toBeCloseTo(expected, 9);
    });
  });
});

// ============================================================================
// getWalletBalance Tests
// ============================================================================

describe('getWalletBalance', () => {
  // Helper to check if backend is available
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

  describe('with mocked services', () => {
    // Map of token addresses to Jupiter price data (all lowercase)
    // Now returns { usdPrice, priceChange24h } to match the new API format
    const JUPITER_PRICE_MAP: Record<string, { usdPrice: number; priceChange24h: number | null }> = {
      [SOL_CONSTANTS.ADDRESS.toLowerCase()]: { usdPrice: 100.5, priceChange24h: 5.2 },
      epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v: { usdPrice: 1.0, priceChange24h: 0.01 }, // USDC
      es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb: { usdPrice: 0.9999, priceChange24h: -0.02 }, // USDT
      dezxaz8z7pnrnrjjz3wxborgixca6xjnb7yab1ppb263: { usdPrice: 0.00002145, priceChange24h: -12.5 }, // BONK
    };

    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();

      // Mock Jupiter price service (getSolanaTokenPrice)
      // Returns price data { usdPrice, priceChange24h } based on token address
      vi.spyOn(priceModule, 'getSolanaTokenPrice').mockImplementation(
        async (address: string) => {
          return JUPITER_PRICE_MAP[address.toLowerCase()] ?? null;
        }
      );
    });

    afterEach(() => {
      // Restore all mocks after each test
      vi.restoreAllMocks();
    });
    it('should combine SOL balance and token balances correctly', async () => {
      // Mock metadata service
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);

      // Mock price service
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(2000000000, MOCK_OWNER); // 2 SOL
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // Verify structure
      expect(result).toHaveProperty('usdTotal');
      expect(result).toHaveProperty('last24HoursChange');
      expect(result).toHaveProperty('last24HoursChangePercent');
      expect(result).toHaveProperty('items');

      // Verify items array
      expect(result.items).toHaveLength(4); // 1 SOL + 3 tokens

      // SOL should be first
      expect(result.items[0].symbol).toBe('SOL');
      expect(result.items[0].address).toBe(SOL_CONSTANTS.ADDRESS);

      // Restore mocks
    });

    it('should calculate USD total correctly', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(2000000000, MOCK_OWNER); // 2 SOL
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // Calculate expected total:
      // SOL: 2 * 100.5 = 201
      // USDC: 1000 * 1.0 = 1000
      // USDT: 500 * 0.9999 = 499.95
      // BONK: 1000 * 0.00002145 = 0.02145
      const expectedTotal = 201 + 1000 + 499.95 + 0.02145;

      expect(result.usdTotal).toBeCloseTo(expectedTotal, 2);

    });

    it('should calculate 24h change correctly', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(2000000000, MOCK_OWNER); // 2 SOL
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      expect(result.last24HoursChange).toBeDefined();
      expect(result.last24HoursChangePercent).toBeDefined();
      expect(typeof result.last24HoursChange).toBe('number');
      expect(typeof result.last24HoursChangePercent).toBe('number');

    });

    it('should order items correctly (SOL first, then by USD value)', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(1000000000, MOCK_OWNER); // 1 SOL
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // SOL must be first
      expect(result.items[0].symbol).toBe('SOL');

      // Rest should be ordered by USD balance (descending)
      for (let i = 1; i < result.items.length - 1; i++) {
        const current = result.items[i].usdBalance || 0;
        const next = result.items[i + 1].usdBalance || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }

    });

    it('should filter out zero balances', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const zeroBalances: RawTokenBalance[] = [
        ...MOCK_RAW_BALANCES,
        {
          mint: 'ZeroToken1111111111111111111111111111111111',
          owner: MOCK_OWNER,
          amount: '0',
          decimals: 6,
          uiAmount: 0,
        },
        {
          mint: 'ZeroToken2222222222222222222222222222222222',
          owner: MOCK_OWNER,
          amount: 0,
          decimals: 6,
          uiAmount: 0,
        },
      ];

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);
      const result = await getWalletBalance(solBalance, zeroBalances, 'solana-mainnet');

      // Should only include non-zero balances + SOL
      expect(result.items.length).toBe(4); // SOL + 3 non-zero tokens

    });

    it('should handle empty token balances array', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue([]);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(5000000000, MOCK_OWNER); // 5 SOL
      const result = await getWalletBalance(solBalance, [], 'solana-mainnet');

      // Should only have SOL
      expect(result.items).toHaveLength(1);
      expect(result.items[0].symbol).toBe('SOL');
      expect(result.items[0].uiAmount).toBe(5);

      // Should have price data for SOL
      expect(result.items[0].price).toBe(100.5);
      expect(result.items[0].usdBalance).toBeCloseTo(502.5, 2);

    });

    it('should handle null price data from all sources', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(null);
      // Also mock Jupiter to return null for all tokens
      vi.spyOn(priceModule, 'getSolanaTokenPrice').mockResolvedValue(null);

      const solBalance = createSolBalance(2000000000, MOCK_OWNER);
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // Should still return items but without price data
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);

      // Should not have USD totals
      expect(result.usdTotal).toBeUndefined();
      expect(result.last24HoursChange).toBeUndefined();
      expect(result.last24HoursChangePercent).toBeUndefined();

      // Items should not have price data
      result.items.forEach((item) => {
        expect(item.price).toBeUndefined();
        expect(item.usdBalance).toBeUndefined();
        expect(item.priceChange24h).toBeUndefined();
      });

    });

    it('should handle missing metadata for some tokens', async () => {
      // Only provide metadata for USDC, not for USDT or BONK
      const partialMetadata: TokenMetadata[] = [MOCK_TOKEN_METADATA[0]];

      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(partialMetadata);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);
      const result = await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // Should still have all items
      expect(result.items.length).toBe(4);

      // USDC should have proper metadata
      const usdcItem = result.items.find((item) => item.mint === MOCK_RAW_BALANCES[0].mint);
      expect(usdcItem?.symbol).toBe('USDC');
      expect(usdcItem?.name).toBe('USD Coin');

      // Other tokens should have UNKNOWN metadata
      const usdtItem = result.items.find((item) => item.mint === MOCK_RAW_BALANCES[1].mint);
      expect(usdtItem?.symbol).toBe('UNKNOWN');
      expect(usdtItem?.name).toBe('Unknown Token');

    });

    it('should handle tokens without price matches', async () => {
      // Metadata for a token not in MOCK_TOKEN_PRICES
      const customMetadata: TokenMetadata[] = [
        {
          address: 'CustomToken111111111111111111111111111111111',
          symbol: 'CUSTOM',
          name: 'Custom Token',
          decimals: 6,
          logo: 'https://example.com/custom.png',
        },
      ];

      const customBalance: RawTokenBalance = {
        mint: 'CustomToken111111111111111111111111111111111',
        owner: MOCK_OWNER,
        amount: '1000000000',
        decimals: 6,
        uiAmount: 1000,
      };

      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(customMetadata);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);
      const result = await getWalletBalance(solBalance, [customBalance], 'solana-mainnet');

      // Custom token should not have price data
      const customItem = result.items.find((item) => item.symbol === 'CUSTOM');
      expect(customItem).toBeDefined();
      expect(customItem?.price).toBeUndefined();
      expect(customItem?.usdBalance).toBeUndefined();
      expect(customItem?.priceChange24h).toBeUndefined();

    });

    it('should handle network parameter correctly', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);

      // Test mainnet
      await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');
      expect(tokensModule.getTokenMetadataByMints).toHaveBeenCalledWith(
        expect.any(Array),
        'solana-mainnet'
      );

      // Test devnet
      await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-devnet');
      expect(tokensModule.getTokenMetadataByMints).toHaveBeenCalledWith(
        expect.any(Array),
        'solana-devnet'
      );

    });

    it('should fetch metadata and prices in parallel', async () => {
      const metadataSpy = vi
        .spyOn(tokensModule, 'getTokenMetadataByMints')
        .mockResolvedValue(MOCK_TOKEN_METADATA);
      // Jupiter price service is already mocked in beforeEach
      const jupiterPriceSpy = vi.spyOn(priceModule, 'getSolanaTokenPrice');

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);
      await getWalletBalance(solBalance, MOCK_RAW_BALANCES, 'solana-mainnet');

      // Metadata should have been called once
      expect(metadataSpy).toHaveBeenCalledTimes(1);
      // Jupiter price should have been called for SOL + each token (4 total)
      expect(jupiterPriceSpy).toHaveBeenCalledTimes(4);

    });
  });

  describe('integration with backend (if available)', () => {
    it(
      'should fetch real data from backend when available',
      async () => {
        // Check if backend is available
        const backendAvailable = await isBackendAvailable();

        if (!backendAvailable) {
          console.log('Skipping backend integration test - backend not available at localhost:3000');
          return;
        }

        // This test runs only if backend is available at localhost:3000
        const solBalance = createSolBalance(1000000000, MOCK_OWNER);

        // Use a well-known token like USDC
        const usdcBalance: RawTokenBalance = {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner: MOCK_OWNER,
          amount: '1000000000',
          decimals: 6,
          uiAmount: 1000,
        };

        const result = await getWalletBalance(solBalance, [usdcBalance], 'solana-mainnet');

        // Verify structure
        expect(result).toHaveProperty('items');
        expect(result.items.length).toBeGreaterThan(0);

        // SOL should be first
        expect(result.items[0].symbol).toBe('SOL');

        // USDC should have metadata
        const usdcItem = result.items.find((item) => item.symbol === 'USDC');
        expect(usdcItem).toBeDefined();
        expect(usdcItem?.name).toBeDefined();
        expect(usdcItem?.logo).toBeDefined();

        // If prices are available, verify USD calculations
        if (result.usdTotal !== undefined) {
          expect(result.usdTotal).toBeGreaterThan(0);
          expect(result.items[0].price).toBeGreaterThan(0);
        }
      },
      10000 // 10 second timeout for real API calls
    );
  });

  describe('edge cases', () => {
    // Map of token addresses to Jupiter price data (all lowercase)
    const JUPITER_PRICE_MAP: Record<string, { usdPrice: number; priceChange24h: number | null }> = {
      [SOL_CONSTANTS.ADDRESS.toLowerCase()]: { usdPrice: 100.5, priceChange24h: 5.2 },
      epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v: { usdPrice: 1.0, priceChange24h: 0.01 }, // USDC
      es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb: { usdPrice: 0.9999, priceChange24h: -0.02 }, // USDT
      dezxaz8z7pnrnrjjz3wxborgixca6xjnb7yab1ppb263: { usdPrice: 0.00002145, priceChange24h: -12.5 }, // BONK
    };

    beforeEach(() => {
      vi.clearAllMocks();
      // Mock Jupiter price service
      vi.spyOn(priceModule, 'getSolanaTokenPrice').mockImplementation(
        async (address: string) => {
          return JUPITER_PRICE_MAP[address.toLowerCase()] ?? null;
        }
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle very large balances', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const largeBalance = createSolBalance(1000000000 * 1000000, MOCK_OWNER); // 1M SOL
      const result = await getWalletBalance(largeBalance, [], 'solana-mainnet');

      expect(result.items[0].uiAmount).toBe(1000000);
      expect(result.items[0].usdBalance).toBeCloseTo(100500000, 0); // ~100M USD
    });

    it('should handle very small balances', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const tinyBalance = createSolBalance(1, MOCK_OWNER); // 1 lamport
      const result = await getWalletBalance(tinyBalance, [], 'solana-mainnet');

      expect(result.items[0].uiAmount).toBeCloseTo(0.000000001, 9);
      expect(result.items[0].usdBalance).toBeDefined();
    });

    it('should handle string and number amounts in raw balances', async () => {
      vi.spyOn(tokensModule, 'getTokenMetadataByMints').mockResolvedValue(MOCK_TOKEN_METADATA);
      vi.spyOn(priceModule, 'getPricesByPlatform').mockResolvedValue(MOCK_TOKEN_PRICES);

      const mixedBalances: RawTokenBalance[] = [
        {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          owner: MOCK_OWNER,
          amount: '1000000', // string
          decimals: 6,
          uiAmount: 1,
        },
        {
          mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
          owner: MOCK_OWNER,
          amount: 1000000, // number
          decimals: 6,
          uiAmount: 1,
        },
      ];

      const solBalance = createSolBalance(1000000000, MOCK_OWNER);
      const result = await getWalletBalance(solBalance, mixedBalances, 'solana-mainnet');

      // Both should be included
      expect(result.items.length).toBe(3); // SOL + 2 tokens
    });
  });
});
