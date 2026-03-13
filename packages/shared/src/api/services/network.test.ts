/**
 * Tests for Network Service
 * Migrated from api/client.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios BEFORE importing the service module
vi.mock('axios', () => {
  const mockCreate = vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }));

  return {
    default: {
      create: mockCreate,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
    create: mockCreate,
    get: vi.fn(),
  };
});

import { apiClient } from '../client';
import { getNetworks, getNetwork, clearNetworksCache } from './network';
import type { Network } from '../../types/blockchain';

describe('Network Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearNetworksCache();
  });

  afterEach(() => {
    clearNetworksCache();
  });

  describe('getNetworks()', () => {
    it('should return array of networks', async () => {
      const mockNetworks: Network[] = [
        { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana', environment: 'mainnet', config: { nodeUrl: 'https://api.mainnet-beta.solana.com' } },
        { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', blockchain: 'ethereum', environment: 'mainnet', config: { rpcUrl: 'https://eth.llamarpc.com', chainId: 1 } },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      const networks = await getNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/networks');
      expect(networks).toEqual(mockNetworks);
    });

    it('should cache networks data on subsequent calls', async () => {
      const mockNetworks: Network[] = [
        { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana', environment: 'mainnet', config: { nodeUrl: 'https://api.mainnet-beta.solana.com' } },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      const networks1 = await getNetworks();
      const networks2 = await getNetworks();

      expect(networks1).toBe(networks2);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should clear cache and retry on error', async () => {
      apiClient.get = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: [{ id: 'test', name: 'Test Network', blockchain: 'solana', environment: 'testnet', config: {} }] });

      await expect(getNetworks()).rejects.toThrow('Network error');

      const networks = await getNetworks();
      expect(networks).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle empty networks array', async () => {
      apiClient.get = vi.fn().mockResolvedValue({ data: [] });

      const networks = await getNetworks();

      expect(Array.isArray(networks)).toBe(true);
      expect(networks).toHaveLength(0);
    });
  });

  describe('getNetwork()', () => {
    it('should return specific network by id', async () => {
      const mockNetworks: Network[] = [
        { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana', environment: 'mainnet', config: { nodeUrl: 'https://api.mainnet-beta.solana.com' } },
        { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', blockchain: 'ethereum', environment: 'mainnet', config: { rpcUrl: 'https://eth.llamarpc.com', chainId: 1 } },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      const network = await getNetwork('solana-mainnet');

      expect(network).toBeDefined();
      expect(network?.id).toBe('solana-mainnet');
      expect(network?.name).toBe('Solana Mainnet');
    });

    it('should return undefined for non-existent network', async () => {
      const mockNetworks: Network[] = [
        { id: 'solana-mainnet', name: 'Solana Mainnet', blockchain: 'solana', environment: 'mainnet', config: { nodeUrl: 'https://api.mainnet-beta.solana.com' } },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      const network = await getNetwork('non-existent-network');

      expect(network).toBeUndefined();
    });

    it('should use cached networks data', async () => {
      const mockNetworks: Network[] = [
        { id: 'test-network', name: 'Test Network', blockchain: 'solana', environment: 'testnet', config: {} },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      await getNetwork('test-network');
      await getNetwork('test-network');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle case-sensitive network ids', async () => {
      const mockNetworks: Network[] = [
        { id: 'Solana-Mainnet', name: 'Solana Mainnet', blockchain: 'solana', environment: 'mainnet', config: {} },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      const network1 = await getNetwork('Solana-Mainnet');
      const network2 = await getNetwork('solana-mainnet');

      expect(network1).toBeDefined();
      expect(network2).toBeUndefined();
    });
  });

  describe('clearNetworksCache()', () => {
    it('should clear the networks cache', async () => {
      const mockNetworks: Network[] = [
        { id: 'test', name: 'Test', blockchain: 'solana', environment: 'testnet', config: {} },
      ];

      apiClient.get = vi.fn().mockResolvedValue({ data: mockNetworks });

      await getNetworks();
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      clearNetworksCache();

      await getNetworks();
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should allow fresh fetch after cache clear', async () => {
      const mockNetworks1: Network[] = [{ id: 'network1', name: 'Network 1', blockchain: 'solana', environment: 'mainnet', config: {} }];
      const mockNetworks2: Network[] = [{ id: 'network2', name: 'Network 2', blockchain: 'bitcoin', environment: 'mainnet', config: {} }];

      apiClient.get = vi
        .fn()
        .mockResolvedValueOnce({ data: mockNetworks1 })
        .mockResolvedValueOnce({ data: mockNetworks2 });

      const networks1 = await getNetworks();
      expect(networks1[0]?.id).toBe('network1');

      clearNetworksCache();

      const networks2 = await getNetworks();
      expect(networks2[0]?.id).toBe('network2');
    });
  });
});
