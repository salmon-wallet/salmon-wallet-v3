import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwitchesResponse } from '../../types/settings';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    staticApiClient: {
      get: vi.fn(),
    },
  };
});

import { createApiClient, staticApiClient } from '../client';
import {
  clearSwitchesCache,
  getEnabledNetworks,
  getSwitch,
  getSwitchMap,
  getSwitches,
  isNetworkEnabled,
} from './switch';

const mockStaticApiClientGet = vi.mocked(staticApiClient.get);
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

const MOCK_SWITCHES: SwitchesResponse = {
  'solana-mainnet': {
    enable: true,
    sections: {
      overview: { active: true },
      token_detail: { active: true },
      collectibles: { active: true },
      swap: { active: true },
      exchange: { active: false },
      transactions: { active: true },
    },
  },
  'bitcoin-mainnet': {
    enable: false,
    sections: {
      overview: { active: true },
      token_detail: { active: false },
      collectibles: { active: false },
      swap: { active: false },
      exchange: { active: false },
      transactions: { active: true },
    },
  },
};

describe('switch service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSwitchesCache();
  });

  it('fetches switches from the static API endpoint', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const result = await getSwitches();

    expect(mockStaticApiClientGet).toHaveBeenCalledWith('/v1/switches');
    expect(result).toEqual(MOCK_SWITCHES);
  });

  it('caches switches for subsequent calls', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const first = await getSwitches();
    const second = await getSwitches();

    expect(first).toBe(second);
    expect(mockStaticApiClientGet).toHaveBeenCalledTimes(1);
  });

  it('clears cache after a failed request so the next call can retry', async () => {
    mockStaticApiClientGet
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ data: MOCK_SWITCHES });

    await expect(getSwitches()).rejects.toThrow('temporary failure');

    const result = await getSwitches();

    expect(result).toEqual(MOCK_SWITCHES);
    expect(mockStaticApiClientGet).toHaveBeenCalledTimes(2);
  });

  it('returns a single network switch when present', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const result = await getSwitch('solana-mainnet');

    expect(result).toEqual(MOCK_SWITCHES['solana-mainnet']);
  });

  it('returns undefined for a network without switch config', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const result = await getSwitch('solana-devnet');

    expect(result).toBeUndefined();
  });

  it('returns the configured enable flag for known networks', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    await expect(isNetworkEnabled('solana-mainnet')).resolves.toBe(true);
    await expect(isNetworkEnabled('bitcoin-mainnet')).resolves.toBe(false);
  });

  it('falls back to the caller default when the network is missing', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    await expect(isNetworkEnabled('solana-devnet')).resolves.toBe(false);
    await expect(isNetworkEnabled('solana-devnet', true)).resolves.toBe(true);
  });

  it('builds a fast enabled-state lookup map', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const result = await getSwitchMap();

    expect(result).toEqual({
      'solana-mainnet': true,
      'bitcoin-mainnet': false,
    });
  });

  it('returns only enabled networks', async () => {
    mockStaticApiClientGet.mockResolvedValueOnce({ data: MOCK_SWITCHES });

    const result = await getEnabledNetworks();

    expect(result).toEqual(['solana-mainnet']);
  });

  it('forces a refetch after clearing cache manually', async () => {
    mockStaticApiClientGet
      .mockResolvedValueOnce({ data: MOCK_SWITCHES })
      .mockResolvedValueOnce({
        data: {
          ...MOCK_SWITCHES,
          'solana-devnet': {
            enable: true,
            sections: {
              overview: { active: true },
              token_detail: { active: true },
              collectibles: { active: false },
              swap: { active: false },
              exchange: { active: false },
              transactions: { active: true },
            },
          },
        } satisfies SwitchesResponse,
      });

    await getSwitches();
    clearSwitchesCache();
    const refreshed = await getSwitches();

    expect(mockStaticApiClientGet).toHaveBeenCalledTimes(2);
    expect(refreshed['solana-devnet']?.enable).toBe(true);
  });
});

const backendBaseUrl = await getReachableBackendBaseUrl();

describe('switch service integration', () => {
  it(
    'reads the live switches endpoint from salmon-api and preserves the expected shape',
    async () => {
      if (!backendBaseUrl) {
        console.log('Skipping live switches integration assertions: backend not reachable');
        return;
      }

      clearSwitchesCache();

      const client = createApiClient({
        baseUrl: backendBaseUrl,
        timeout: 5000,
      });

      const response = await client.get<SwitchesResponse>('/v1/switches');

      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
      expect(Object.keys(response.data).length).toBeGreaterThan(0);

      for (const [networkId, config] of Object.entries(response.data)) {
        expect(networkId).toBeTruthy();
        expect(typeof config.enable).toBe('boolean');
        expect(config.sections).toEqual(
          expect.objectContaining({
            overview: expect.objectContaining({ active: expect.any(Boolean) }),
            token_detail: expect.objectContaining({ active: expect.any(Boolean) }),
            collectibles: expect.objectContaining({ active: expect.any(Boolean) }),
            swap: expect.objectContaining({ active: expect.any(Boolean) }),
            exchange: expect.objectContaining({ active: expect.any(Boolean) }),
            transactions: expect.objectContaining({ active: expect.any(Boolean) }),
          }),
        );
      }
    },
    10000,
  );
});
