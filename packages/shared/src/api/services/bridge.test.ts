import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BridgeAvailableToken,
  BridgeExchange,
  BridgeFeaturedToken,
  BridgeToken,
  BridgeTransaction,
} from '../../types/bridge';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

import { apiClient, createApiClient } from '../client';
import {
  createBridgeExchange,
  getBridgeAvailableTokens,
  getBridgeEstimatedAmount,
  getBridgeFeaturedTokens,
  getBridgeMinimalAmount,
  getBridgeSupportedTokens,
  getBridgeTransaction,
} from './bridge';

const mockApiClientGet = vi.mocked(apiClient.get);
const DEFAULT_LOCAL_HOST = 'localhost';

function getBackendBaseUrlCandidates(): string[] {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.VITE_API_URL || process.env.API_URL;
  const envHost = process.env.EXPO_PUBLIC_API_HOST || process.env.VITE_API_HOST || DEFAULT_LOCAL_HOST;
  const envPort = process.env.EXPO_PUBLIC_API_PORT || process.env.VITE_API_PORT;
  const candidates = [
    envApiUrl,
    envPort ? `http://${envHost}:${envPort}/local` : undefined,
    'http://127.0.0.1:3001/local',
    'http://127.0.0.1:3000/local',
    'http://localhost:3001/local',
    'http://localhost:3000/local',
  ];

  return [...new Set(candidates.filter(Boolean))] as string[];
}

async function getReachableBackendBaseUrl(): Promise<string | null> {
  for (const baseUrl of getBackendBaseUrlCandidates()) {
    try {
      const client = createApiClient({
        baseUrl,
        timeout: 2000,
      });
      await client.get('/health');
      return baseUrl;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

const MOCK_SUPPORTED_TOKENS: BridgeToken[] = [
  { symbol: 'SOL', name: 'Solana', network: 'SOLANA', enabled: true },
  { symbol: 'BTC', name: 'Bitcoin', network: 'BITCOIN', enabled: true },
];

const MOCK_AVAILABLE_TOKENS: BridgeAvailableToken[] = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'BITCOIN', available: true },
];

const MOCK_FEATURED_TOKENS: BridgeFeaturedToken[] = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'BITCOIN', rank: 1 },
];

const MOCK_EXCHANGE: BridgeExchange = {
  id: 'exchange-123',
  currencyFrom: 'sol',
  currencyTo: 'btc',
  amountExpectedFrom: 1.5,
  amountExpectedTo: 0.0021,
  payinAddress: 'deposit-address',
  payoutAddress: 'destination-address',
  status: 'waiting',
};

const MOCK_TRANSACTION: BridgeTransaction = {
  id: 'exchange-123',
  currencyFrom: 'sol',
  currencyTo: 'btc',
  payinAddress: 'deposit-address',
  payoutAddress: 'destination-address',
  status: 'waiting',
};

describe('bridge service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches supported bridge tokens for a network', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_SUPPORTED_TOKENS });

    const result = await getBridgeSupportedTokens('solana');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/supported', {
      params: { network: 'solana' },
    });
    expect(result).toEqual(MOCK_SUPPORTED_TOKENS);
  });

  it('lowercases the source symbol for available bridge tokens', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_AVAILABLE_TOKENS });

    const result = await getBridgeAvailableTokens('SOL');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/available', {
      params: { symbol: 'sol' },
    });
    expect(result).toEqual(MOCK_AVAILABLE_TOKENS);
  });

  it('lowercases the source symbol for featured bridge tokens', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_FEATURED_TOKENS });

    const result = await getBridgeFeaturedTokens('SOL');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/featured', {
      params: { symbol: 'sol' },
    });
    expect(result).toEqual(MOCK_FEATURED_TOKENS);
  });

  it('includes optional network filters when fetching bridge estimates', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: { estimated_amount: 0.0021 },
    });

    const result = await getBridgeEstimatedAmount('SOL', 'BTC', 1.5, 'SOLANA', 'BITCOIN');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/estimate', {
      params: {
        symbolIn: 'sol',
        symbolOut: 'btc',
        amount: 1.5,
        networkIn: 'SOLANA',
        networkOut: 'BITCOIN',
      },
    });
    expect(result).toBe(0.0021);
  });

  it('returns null when estimate payload omits estimated amount', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: {} });

    const result = await getBridgeEstimatedAmount('SOL', 'BTC', 1.5);

    expect(result).toBeNull();
  });

  it('includes optional network filters when fetching bridge minimum amount', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: { min_amount: 0.1 },
    });

    const result = await getBridgeMinimalAmount('SOL', 'BTC', 'SOLANA', 'BITCOIN');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/minimal', {
      params: {
        symbolIn: 'sol',
        symbolOut: 'btc',
        networkIn: 'SOLANA',
        networkOut: 'BITCOIN',
      },
    });
    expect(result).toBe(0.1);
  });

  it('lowercases symbols and forwards destination data when creating an exchange', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_EXCHANGE });

    const result = await createBridgeExchange(
      'SOL',
      'BTC',
      1.5,
      'destination-address',
      'SOLANA',
      'BITCOIN',
    );

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/exchange', {
      params: {
        symbolIn: 'sol',
        symbolOut: 'btc',
        amount: 1.5,
        addressTo: 'destination-address',
        networkIn: 'SOLANA',
        networkOut: 'BITCOIN',
      },
    });
    expect(result).toEqual(MOCK_EXCHANGE);
  });

  it('fetches a bridge transaction by id', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await getBridgeTransaction('exchange-123');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/bridge/transaction', {
      params: { id: 'exchange-123' },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('wraps supported token failures with bridge-specific context', async () => {
    mockApiClientGet.mockRejectedValueOnce(new Error('boom'));

    await expect(getBridgeSupportedTokens('solana')).rejects.toThrow(
      'Bridge fetch supported tokens failed: boom',
    );
  });

  it('wraps exchange creation failures with bridge-specific context', async () => {
    mockApiClientGet.mockRejectedValueOnce(new Error('exchange down'));

    await expect(
      createBridgeExchange('SOL', 'BTC', 1.5, 'destination-address'),
    ).rejects.toThrow('Bridge create exchange failed: exchange down');
  });
});

const backendBaseUrl = await getReachableBackendBaseUrl();

describe('bridge service integration', () => {
  it(
    'reads the live supported bridge token endpoint from salmon-api',
    async () => {
      if (!backendBaseUrl) {
        console.log('Skipping live bridge integration assertions: backend not reachable');
        return;
      }

      const client = createApiClient({
        baseUrl: backendBaseUrl,
        timeout: 10000,
      });

      const response = await client.get<BridgeToken[]>('/v1/bridge/supported', {
        params: { network: 'solana' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      for (const token of response.data) {
        expect(token.symbol).toBeTruthy();
        expect(token.name).toBeTruthy();
      }
    },
    15000,
  );
});
