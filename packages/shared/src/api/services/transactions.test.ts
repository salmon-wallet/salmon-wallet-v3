import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionsResponse } from '../../types/transaction';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
    },
  };
});

import { ApiError, apiClient } from '../client';
import { getReachableBackendBaseUrl } from '../test-backend';
import { getTransactions } from './transactions';

const mockApiClientGet = vi.mocked(apiClient.get);
const backendBaseUrl = await getReachableBackendBaseUrl();

const MOCK_TRANSACTIONS: TransactionsResponse = {
  data: [
    {
      id: 'tx-1',
      timestamp: 1710000000,
      status: 'completed',
      type: 'receive',
      inputs: [],
      outputs: [],
    },
  ],
  pageToken: 'next-page',
};

async function fetchWithRetry(url: string, attempts = 2): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok || response.status < 500 || attempt === attempts) {
        return response;
      }
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${url}`);
}

describe('transactions service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards pagination params to the backend transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTIONS });

    const result = await getTransactions('bitcoin-mainnet', 'address-1', {
      pageSize: 25,
      pageToken: 'cursor-1',
    });

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/bitcoin-mainnet/account/address-1/transactions',
      {
        params: {
          pageSize: 25,
          pageToken: 'cursor-1',
        },
      },
    );
    expect(result).toEqual(MOCK_TRANSACTIONS);
  });

  it('omits empty pagination params', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: { data: [] } });

    const result = await getTransactions('bitcoin-mainnet', 'address-1');

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/bitcoin-mainnet/account/address-1/transactions',
      { params: {} },
    );
    expect(result).toEqual({ data: [] });
  });

  it('normalizes missing data arrays to empty arrays', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: { pageToken: 'cursor-2' } });

    const result = await getTransactions('bitcoin-mainnet', 'address-1');

    expect(result).toEqual({
      data: [],
      pageToken: 'cursor-2',
    });
  });

  it('returns an empty list on 404', async () => {
    mockApiClientGet.mockRejectedValueOnce(
      new ApiError('Not found', 404, 'not_found'),
    );

    const result = await getTransactions('bitcoin-mainnet', 'missing-address');

    expect(result).toEqual({ data: [] });
  });

  it('rethrows non-404 api errors', async () => {
    mockApiClientGet.mockRejectedValueOnce(
      new ApiError('Server exploded', 500, 'server_error'),
    );

    await expect(
      getTransactions('bitcoin-mainnet', 'address-1'),
    ).rejects.toThrow('Server exploded');
  });
});

describe('transactions service integration', () => {
  it(
    'reads real bitcoin transaction history from salmon-api and preserves response shape',
    async () => {
      const liveBackendBaseUrl = backendBaseUrl ?? await getReachableBackendBaseUrl();
      if (!liveBackendBaseUrl) {
        console.log('Skipping live transactions integration assertions: backend not reachable');
        return;
      }

      mockApiClientGet.mockImplementation(async (path, config) => {
        const url = new URL(`${liveBackendBaseUrl}${path as string}`);
        const params = config?.params as Record<string, string | number> | undefined;
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value));
          }
        }

        const response = await fetchWithRetry(url.toString());

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }

        return {
          data: await response.json(),
        } as { data: TransactionsResponse };
      });

      const result = await getTransactions(
        'bitcoin-mainnet',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        { pageSize: 2 },
      );

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          status: expect.any(String),
          type: expect.any(String),
          inputs: expect.any(Array),
          outputs: expect.any(Array),
        }),
      );
    },
    20000,
  );
});
