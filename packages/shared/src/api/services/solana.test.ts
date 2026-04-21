import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SolanaBalanceItem } from '../../types/transfer';
import type { SolanaTransaction } from '../../types/transaction';
import type { ApiSwapExecuteResponse, SwapOrderResponse } from '../../types/swap';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
    get: vi.fn(),
  };
});

vi.mock('./balance', () => ({
  getJupiterPrices: vi.fn(),
}));

vi.mock('./tokens', () => ({
  getTokenMetadataByMints: vi.fn(),
}));

vi.mock('./solana-nft', () => ({
  getSolanaNfts: vi.fn(),
}));

import { ApiError, apiClient, get } from '../client';
import { getReachableBackendBaseUrl } from '../test-backend';
import { getJupiterPrices } from './balance';
import { getSolanaNfts } from './solana-nft';
import {
  executeSwapApi,
  fetchSolanaAccountBalance,
  getAllSolanaTransactions,
  getRecentSolanaTransactions,
  getSolanaTransaction,
  getSolanaTransactions,
  getSwapOrder,
  getTransactionsByType,
  solanaApiFunctions,
} from './solana';
import { getTokenMetadataByMints } from './tokens';

const mockApiClientGet = vi.mocked(apiClient.get);
const mockApiClientPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(get);
const mockGetJupiterPrices = vi.mocked(getJupiterPrices);
const mockGetTokenMetadataByMints = vi.mocked(getTokenMetadataByMints);
const mockGetSolanaNfts = vi.mocked(getSolanaNfts);
const backendBaseUrl = await getReachableBackendBaseUrl();

const MOCK_SOLANA_TRANSACTION = {
  id: 'sig-1',
  signature: 'sig-1',
  timestamp: 1710000000,
  status: 'completed',
  type: 'interaction',
  inputs: [],
  outputs: [],
} as SolanaTransaction;

const MOCK_SWAP_ORDER: SwapOrderResponse = {
  routeNames: ['Raydium'],
  routeSymbols: ['SOL', 'USDC'],
  fee: {
    amount: 5000,
    decimals: 9,
    symbol: 'SOL',
    percent: 0.5,
  },
  input: {
    amount: '1000000',
    decimals: 9,
    symbol: 'SOL',
  },
  output: {
    amount: '85539',
    decimals: 6,
    symbol: 'USDC',
  },
  custom: {
    transaction: 'base64-transaction',
    requestId: 'request-1',
    router: 'okx',
    priceImpact: -0.45,
    feeBps: 50,
    prioritizationFeeLamports: 42608,
    rentFeeLamports: 2039280,
    gasless: false,
    slippageBps: 22,
    swapMode: 'ExactIn',
    otherAmountThreshold: '85350',
  },
};

const MOCK_SWAP_EXECUTE_RESPONSE: ApiSwapExecuteResponse = {
  signature: 'swap-signature',
  status: 'Success',
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

describe('solana service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards solana transaction pagination and type params', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [MOCK_SOLANA_TRANSACTION],
        meta: { nextPageToken: 'cursor-1' },
      },
    });

    const result = await getSolanaTransactions(
      'solana-mainnet',
      'wallet-1',
      {
        pageToken: 'cursor-0',
        pageSize: 5,
        type: 'UNKNOWN',
      },
    );

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/transactions',
      {
        params: {
          pageToken: 'cursor-0',
          pageSize: 5,
          type: 'UNKNOWN',
        },
      },
    );
    expect(result).toEqual({
      transactions: [MOCK_SOLANA_TRANSACTION],
      oldestSignature: 'cursor-1',
      hasMore: true,
    });
  });

  it('supports legacy before/limit paging aliases', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [MOCK_SOLANA_TRANSACTION],
      },
    });

    await getSolanaTransactions('solana-mainnet', 'wallet-1', {
      before: 'legacy-cursor',
      limit: 3,
    });

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/transactions',
      {
        params: {
          pageToken: 'legacy-cursor',
          pageSize: 3,
        },
      },
    );
  });

  it('returns empty transaction history on 404', async () => {
    mockApiClientGet.mockRejectedValueOnce(new ApiError('Not found', 404, 'not_found'));

    const result = await getSolanaTransactions('solana-mainnet', 'missing-wallet');

    expect(result).toEqual({
      transactions: [],
      oldestSignature: null,
      hasMore: false,
    });
  });

  it('fetches a single solana transaction', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_SOLANA_TRANSACTION });

    const result = await getSolanaTransaction('solana-mainnet', 'wallet-1', 'sig-1');

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/transactions/sig-1',
    );
    expect(result).toEqual(MOCK_SOLANA_TRANSACTION);
  });

  it('returns null for a missing solana transaction', async () => {
    mockApiClientGet.mockRejectedValueOnce(new ApiError('Not found', 404, 'not_found'));

    const result = await getSolanaTransaction('solana-mainnet', 'wallet-1', 'missing-sig');

    expect(result).toBeNull();
  });

  it('forwards all supported swap quote params', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_SWAP_ORDER });

    const result = await getSwapOrder('solana-mainnet', {
      inputMint: 'mint-in',
      outputMint: 'mint-out',
      amount: '1000000',
      publicKey: 'wallet-1',
      slippageBps: 50,
      swapMode: 'ExactIn',
      dynamicSlippage: true,
      priorityLevel: 'high',
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/ft/swap/order', {
      params: {
        inputMint: 'mint-in',
        outputMint: 'mint-out',
        amount: '1000000',
        publicKey: 'wallet-1',
        slippageBps: 50,
        swapMode: 'ExactIn',
        dynamicSlippage: true,
        priorityLevel: 'high',
      },
    });
    expect(result).toEqual(MOCK_SWAP_ORDER);
  });

  it('returns null for missing swap routes', async () => {
    mockApiClientGet.mockRejectedValueOnce(new ApiError('Not found', 404, 'not_found'));

    const result = await getSwapOrder('solana-mainnet', {
      inputMint: 'mint-in',
      outputMint: 'mint-out',
      amount: '1000000',
      publicKey: 'wallet-1',
    });

    expect(result).toBeNull();
  });

  it('posts signed swap execution payloads', async () => {
    mockApiClientPost.mockResolvedValueOnce({ data: MOCK_SWAP_EXECUTE_RESPONSE });

    const result = await executeSwapApi('solana-mainnet', 'signed-transaction', 'request-1');

    expect(mockApiClientPost).toHaveBeenCalledWith(
      '/v1/solana-mainnet/ft/swap/execute',
      {
        signedTransaction: 'signed-transaction',
        requestId: 'request-1',
      },
    );
    expect(result).toEqual(MOCK_SWAP_EXECUTE_RESPONSE);
  });

  it('returns failed execute responses for api errors', async () => {
    mockApiClientPost.mockRejectedValueOnce(
      new ApiError('swap execution failed', 400, 'swap_failed'),
    );

    const result = await executeSwapApi('solana-mainnet', 'signed-transaction', 'request-1');

    expect(result).toEqual({
      signature: '',
      status: 'Failed',
      error: 'swap execution failed',
    });
  });

  it('collects all solana transactions across multiple pages', async () => {
    mockApiClientGet
      .mockResolvedValueOnce({
        data: {
          data: [MOCK_SOLANA_TRANSACTION],
          meta: { nextPageToken: 'cursor-1' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ ...MOCK_SOLANA_TRANSACTION, id: 'sig-2', signature: 'sig-2' }],
        },
      });

    const result = await getAllSolanaTransactions('solana-mainnet', 'wallet-1', 2);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('sig-1');
    expect(result[1].id).toBe('sig-2');
  });

  it('fetches recent solana transactions using the limit alias', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [MOCK_SOLANA_TRANSACTION],
      },
    });

    const result = await getRecentSolanaTransactions('solana-mainnet', 'wallet-1', 10);

    expect(result).toEqual([MOCK_SOLANA_TRANSACTION]);
    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/transactions',
      {
        params: {
          pageSize: 10,
        },
      },
    );
  });

  it('filters solana transactions by type using the limit alias', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [MOCK_SOLANA_TRANSACTION],
      },
    });

    const result = await getTransactionsByType(
      'solana-mainnet',
      'wallet-1',
      'UNKNOWN',
      20,
    );

    expect(result).toEqual([MOCK_SOLANA_TRANSACTION]);
    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/transactions',
      {
        params: {
          pageSize: 20,
          type: 'UNKNOWN',
        },
      },
    );
  });

  it('enriches solana balances with token metadata and computed ui amounts', async () => {
    mockGet.mockResolvedValueOnce([
      {
        amount: 1000000000,
        decimals: 9,
        symbol: 'SOL',
        name: 'Solana',
        logo: 'sol-logo',
      },
      {
        amount: 2500000,
        decimals: 6,
        mint: 'mint-1',
        symbol: 'OLD',
        name: 'Old Token',
        logo: 'old-logo',
        coingeckoId: 'old-token',
      },
      {
        amount: 0,
        decimals: 6,
        mint: 'mint-2',
        symbol: 'ZERO',
      },
    ] as SolanaBalanceItem[]);

    mockGetTokenMetadataByMints.mockResolvedValueOnce([
      {
        address: 'mint-1',
        symbol: 'NEW',
        name: 'New Token',
        logo: 'new-logo',
        coingeckoId: 'new-token',
        tags: ['verified'],
      },
    ] as never);

    const result = await fetchSolanaAccountBalance('solana-mainnet', 'wallet-1');

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/account/wallet-1/balance',
      { params: { include: 'logo' } },
    );
    expect(mockGetTokenMetadataByMints).toHaveBeenCalledWith(['mint-1', 'mint-2'], 'solana-mainnet');
    expect(result).toEqual([
      expect.objectContaining({
        symbol: 'SOL',
        uiAmount: 1,
      }),
      expect.objectContaining({
        mint: 'mint-1',
        symbol: 'NEW',
        name: 'New Token',
        logo: 'new-logo',
        coingeckoId: 'new-token',
        uiAmount: 2.5,
      }),
    ]);
  });

  it('wires solana api functions to the expected dependencies', async () => {
    mockGetJupiterPrices.mockResolvedValueOnce([{ address: 'mint-1', usdPrice: 1 }] as never);
    mockGetSolanaNfts.mockResolvedValueOnce([{ mint: { address: 'nft-1' } }] as never);

    await expect(
      solanaApiFunctions.fetchPrices(
        'solana-mainnet',
        ['mint-1'],
        new Map([['mint-1', { coingeckoId: 'hint' }]]),
      ),
    ).resolves.toEqual([{ address: 'mint-1', usdPrice: 1 }]);

    await expect(
      solanaApiFunctions.fetchNfts('solana-mainnet', 'wallet-1', false),
    ).resolves.toEqual([{ mint: { address: 'nft-1' } }]);

    expect(mockGetJupiterPrices).toHaveBeenCalledWith(
      ['mint-1'],
      'solana-mainnet',
      new Map([['mint-1', { coingeckoId: 'hint' }]]),
    );
    expect(mockGetSolanaNfts).toHaveBeenCalledWith('solana-mainnet', 'wallet-1', false);
  });
});

describe('solana service integration', () => {
  const walletAddress = '9mpJyg7iEse9rPMP1tdiSdSAYbLJX6nJyGbNkbT3SAd3';

  it(
    'reads live solana transaction history from salmon-api',
    async () => {
      const liveBackendBaseUrl = backendBaseUrl ?? await getReachableBackendBaseUrl();
      if (!liveBackendBaseUrl) {
        console.log('Skipping live solana transaction integration assertions: backend not reachable');
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
        } as { data: { data: SolanaTransaction[]; meta?: { nextPageToken?: string } } };
      });

      const result = await getSolanaTransactions('solana-mainnet', walletAddress, { pageSize: 1 });

      expect(Array.isArray(result.transactions)).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.transactions[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          signature: expect.any(String),
          timestamp: expect.any(Number),
          status: expect.any(String),
          inputs: expect.any(Array),
          outputs: expect.any(Array),
        }),
      );
    },
    20000,
  );

  it(
    'reads a live solana transaction detail from salmon-api',
    async () => {
      const liveBackendBaseUrl = backendBaseUrl ?? await getReachableBackendBaseUrl();
      if (!liveBackendBaseUrl) {
        console.log('Skipping live solana transaction detail assertions: backend not reachable');
        return;
      }

      const signature =
        '3z56JsXvaPB7rauJYoNDui4SjwZNGAZw9DDZML29qmm6u8WVMGTkiAc7dfYe7SdHFXNa7H9Hnas6uvnsyA9a7UJc';

      mockApiClientGet.mockImplementation(async (path) => {
        const response = await fetchWithRetry(`${liveBackendBaseUrl}${path as string}`);

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }

        return {
          data: await response.json(),
        } as { data: SolanaTransaction };
      });

      const result = await getSolanaTransaction('solana-mainnet', walletAddress, signature);

      expect(result).toEqual(
        expect.objectContaining({
          id: signature,
          timestamp: expect.any(Number),
          status: expect.any(String),
          inputs: expect.any(Array),
          outputs: expect.any(Array),
        }),
      );
    },
    20000,
  );

  it(
    'reads a live solana swap quote from salmon-api',
    async () => {
      const liveBackendBaseUrl = backendBaseUrl ?? await getReachableBackendBaseUrl();
      if (!liveBackendBaseUrl) {
        console.log('Skipping live solana swap quote assertions: backend not reachable');
        return;
      }

      mockApiClientGet.mockImplementation(async (path, config) => {
        const url = new URL(`${liveBackendBaseUrl}${path as string}`);
        const params = config?.params as Record<string, string | number | boolean> | undefined;
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
        } as { data: SwapOrderResponse };
      });

      const result = await getSwapOrder('solana-mainnet', {
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: '1000000',
        publicKey: walletAddress,
      });

      expect(result).toEqual(
        expect.objectContaining({
          output: expect.objectContaining({
            amount: expect.any(String),
          }),
          custom: expect.objectContaining({
            transaction: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    },
    20000,
  );
});
