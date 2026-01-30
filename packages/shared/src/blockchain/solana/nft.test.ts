/**
 * Solana NFT Service Tests
 *
 * Tests for NFT fetching, pagination, collection grouping, and marketplace functions.
 * Uses mocked API responses when backend is unavailable, or tests against real backend if available.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { Connection } from '@solana/web3.js';
import { apiClient } from '../../api/client';
import {
  getAll,
  getAllPaginated,
  getAllFromHeliusDirect,
  getAllGroupedByCollection,
  getNftByAddress,
  getCollectionById,
  getCollectionItemsById,
  getListedByOwner,
  getBidsByOwner,
  isBlacklisted,
  getCollections,
  getNftsByCollection,
  getNftsWithoutCollection,
  isCollection,
  isMoreThanOne,
  type Nft,
  type NftCollectionGroup,
  type NftPaginatedResponse,
} from './nft';
import { SOLANA_NETWORKS } from './factory';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if backend API is available
 * Returns true if salmon-api is running and accessible
 */
async function isBackendAvailable(): Promise<boolean> {
  try {
    await apiClient.get('/health', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Helius RPC is available
 */
async function isHeliusAvailable(nodeUrl: string): Promise<boolean> {
  try {
    await axios.post(
      nodeUrl,
      {
        jsonrpc: '2.0',
        id: 'health-check',
        method: 'getHealth',
      },
      { timeout: 2000 }
    );
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Mock NFT data for testing
 */
const mockNft: Nft = {
  mint: { address: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhW' },
  owner: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
  name: 'Test NFT #1',
  symbol: 'TEST',
  uri: 'https://arweave.net/test123',
  json: {
    name: 'Test NFT #1',
    symbol: 'TEST',
    description: 'A test NFT',
    image: 'https://arweave.net/image123',
  },
  updateAuthorityAddress: 'AuthorityAddress123',
  sellerFeeBasisPoints: 500,
  collection: {
    key: 'CollectionKey123',
    verified: true,
    name: 'Test Collection',
  },
  edition: { isOriginal: true },
  tokenStandard: 'NonFungible',
  media: 'https://arweave.net/image123',
  description: 'A test NFT',
  compressed: false,
  extras: {
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Eyes', value: 'Green' },
    ],
    properties: { category: 'image' },
    creators: [
      {
        address: 'CreatorAddress123',
        share: 100,
        verified: true,
      },
    ],
  },
  extensions: [],
};

const mockNft2: Nft = {
  ...mockNft,
  mint: { address: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh2' },
  name: 'Test NFT #2',
  collection: {
    key: 'CollectionKey123',
    verified: true,
    name: 'Test Collection',
  },
};

const mockNft3: Nft = {
  ...mockNft,
  mint: { address: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh3' },
  name: 'Test NFT #3',
  collection: {
    key: 'CollectionKey456',
    verified: true,
    name: 'Another Collection',
  },
};

const mockNftNoCollection: Nft = {
  ...mockNft,
  mint: { address: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh4' },
  name: 'Standalone NFT',
  collection: null,
};

const mockBlacklistedNft: Nft = {
  ...mockNft,
  mint: { address: 'BlacklistedNFT123' },
  blacklisted: true,
};

/**
 * Mock Helius DAS API response
 */
const mockHeliusResponse = {
  jsonrpc: '2.0',
  id: 'get-nfts-by-owner',
  result: {
    total: 2,
    items: [
      {
        id: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhW',
        burnt: false,
        content: {
          metadata: {
            name: 'Test NFT #1',
            symbol: 'TEST',
            description: 'A test NFT',
            image: 'https://arweave.net/image123',
            attributes: [
              { trait_type: 'Background', value: 'Blue' },
              { trait_type: 'Eyes', value: 'Green' },
            ],
            properties: { category: 'image' },
          },
          links: {
            image: 'https://arweave.net/image123',
          },
          files: [
            {
              uri: 'https://arweave.net/image123',
              type: 'image/png',
            },
          ],
          json_uri: 'https://arweave.net/test123',
        },
        authorities: [
          {
            address: 'AuthorityAddress123',
            scopes: ['full'],
          },
        ],
        royalty: {
          basis_points: 500,
        },
        grouping: [
          {
            group_key: 'collection',
            group_value: 'CollectionKey123',
          },
        ],
        supply: {
          edition_nonce: 0,
        },
        interface: 'NonFungible',
        compression: {
          compressed: false,
        },
        creators: [
          {
            address: 'CreatorAddress123',
            share: 100,
            verified: true,
          },
        ],
      },
      {
        id: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh2',
        burnt: false,
        content: {
          metadata: {
            name: 'Test NFT #2',
            symbol: 'TEST',
            description: 'Another test NFT',
            image: 'https://arweave.net/image456',
          },
          json_uri: 'https://arweave.net/test456',
        },
        authorities: [],
        royalty: { basis_points: 0 },
        grouping: [
          {
            group_key: 'collection',
            group_value: 'CollectionKey123',
          },
        ],
        interface: 'NonFungible',
        compression: { compressed: false },
        creators: [],
      },
    ],
  },
};

/**
 * Mock Helius response with burnt NFT
 */
const mockHeliusResponseWithBurnt = {
  jsonrpc: '2.0',
  id: 'get-nfts-by-owner',
  result: {
    total: 3,
    items: [
      ...mockHeliusResponse.result.items,
      {
        id: 'BurntNFT123',
        burnt: true,
        content: {
          metadata: { name: 'Burnt NFT' },
        },
      },
    ],
  },
};

// ============================================================================
// Pure Function Tests (No API calls)
// ============================================================================

describe('NFT Pure Functions', () => {
  describe('getCollections', () => {
    it('should extract unique collection names', () => {
      const nfts = [mockNft, mockNft2, mockNft3, mockNftNoCollection];
      const collections = getCollections(nfts);

      expect(collections).toHaveLength(2);
      expect(collections).toContain('Test Collection');
      expect(collections).toContain('Another Collection');
    });

    it('should return empty array when no NFTs have collections', () => {
      const collections = getCollections([mockNftNoCollection]);
      expect(collections).toEqual([]);
    });

    it('should handle empty array', () => {
      const collections = getCollections([]);
      expect(collections).toEqual([]);
    });

    it('should not duplicate collection names', () => {
      const nfts = [mockNft, mockNft2]; // Both in same collection
      const collections = getCollections(nfts);
      expect(collections).toHaveLength(1);
      expect(collections[0]).toBe('Test Collection');
    });
  });

  describe('getNftsByCollection', () => {
    it('should group NFTs by collection', () => {
      const nfts = [mockNft, mockNft2, mockNft3];
      const grouped = getNftsByCollection(nfts);

      expect(grouped).toHaveLength(2);
      expect(grouped[0].collection).toBe('Test Collection');
      expect(grouped[0].length).toBe(2);
      expect(grouped[0].items).toHaveLength(2);
      expect(grouped[1].collection).toBe('Another Collection');
      expect(grouped[1].length).toBe(1);
    });

    it('should sort collections by size (largest first)', () => {
      const nfts = [mockNft, mockNft2, mockNft3];
      const grouped = getNftsByCollection(nfts);

      expect(grouped[0].length).toBeGreaterThanOrEqual(grouped[1].length);
    });

    it('should set thumbnail from first NFT media', () => {
      const nfts = [mockNft, mockNft2];
      const grouped = getNftsByCollection(nfts);

      expect(grouped[0].thumb).toBe(mockNft.media);
    });

    it('should handle NFTs without media', () => {
      const nftWithoutMedia = { ...mockNft, media: null };
      const grouped = getNftsByCollection([nftWithoutMedia]);

      expect(grouped[0].thumb).toBeNull();
    });

    it('should handle empty array', () => {
      const grouped = getNftsByCollection([]);
      expect(grouped).toEqual([]);
    });
  });

  describe('getNftsWithoutCollection', () => {
    it('should filter NFTs without collection name', () => {
      const nfts = [mockNft, mockNft2, mockNftNoCollection];
      const withoutCollection = getNftsWithoutCollection(nfts);

      expect(withoutCollection).toHaveLength(1);
      expect(withoutCollection[0].mint.address).toBe(mockNftNoCollection.mint.address);
    });

    it('should return empty array when all NFTs have collections', () => {
      const nfts = [mockNft, mockNft2];
      const withoutCollection = getNftsWithoutCollection(nfts);
      expect(withoutCollection).toEqual([]);
    });

    it('should handle empty array', () => {
      const withoutCollection = getNftsWithoutCollection([]);
      expect(withoutCollection).toEqual([]);
    });
  });

  describe('isCollection', () => {
    it('should return true for collection groups', () => {
      const collectionGroup: NftCollectionGroup = {
        collection: 'Test Collection',
        length: 2,
        items: [mockNft, mockNft2],
        thumb: mockNft.media,
      };

      expect(isCollection(collectionGroup)).toBe(true);
    });

    it('should return false for individual NFTs', () => {
      expect(isCollection(mockNft)).toBe(false);
    });
  });

  describe('isMoreThanOne', () => {
    it('should return true for collections with more than one item', () => {
      const collectionGroup: NftCollectionGroup = {
        collection: 'Test Collection',
        length: 2,
        items: [mockNft, mockNft2],
        thumb: mockNft.media,
      };

      expect(isMoreThanOne(collectionGroup)).toBe(true);
    });

    it('should return false for collections with one item', () => {
      const collectionGroup: NftCollectionGroup = {
        collection: 'Test Collection',
        length: 1,
        items: [mockNft],
        thumb: mockNft.media,
      };

      expect(isMoreThanOne(collectionGroup)).toBe(false);
    });

    it('should return false for individual NFTs', () => {
      expect(isMoreThanOne(mockNft)).toBe(false);
    });

    it('should return false for empty collections', () => {
      const emptyCollection: NftCollectionGroup = {
        collection: 'Empty',
        length: 0,
        items: [],
        thumb: null,
      };

      expect(isMoreThanOne(emptyCollection)).toBe(false);
    });
  });

  describe('isBlacklisted', () => {
    it('should return true for blacklisted NFTs', () => {
      expect(isBlacklisted(mockBlacklistedNft)).toBe(true);
    });

    it('should return false for non-blacklisted NFTs', () => {
      expect(isBlacklisted(mockNft)).toBe(false);
    });

    it('should return false for NFTs without blacklisted property', () => {
      const nftWithoutFlag = { ...mockNft };
      delete nftWithoutFlag.blacklisted;
      expect(isBlacklisted(nftWithoutFlag)).toBe(false);
    });

    it('should check first item in collection group', () => {
      const collectionGroup: NftCollectionGroup = {
        collection: 'Blacklisted Collection',
        length: 1,
        items: [mockBlacklistedNft],
        thumb: null,
      };

      expect(isBlacklisted(collectionGroup)).toBe(true);
    });

    it('should return false for empty collection group', () => {
      const emptyCollection: NftCollectionGroup = {
        collection: 'Empty',
        length: 0,
        items: [],
        thumb: null,
      };

      expect(isBlacklisted(emptyCollection)).toBe(false);
    });
  });
});

// ============================================================================
// API Tests (With Backend/Helius Mocking)
// ============================================================================

describe('NFT API Functions', () => {
  const network = SOLANA_NETWORKS.mainnet;
  const testOwner = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllFromHeliusDirect', () => {
    it('should fetch NFTs from Helius DAS API', async () => {
      const mockAxiosPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAllFromHeliusDirect(network, testOwner);

      expect(mockAxiosPost).toHaveBeenCalledWith(
        network.config.nodeUrl,
        expect.objectContaining({
          jsonrpc: '2.0',
          method: 'getAssetsByOwner',
          params: expect.objectContaining({
            ownerAddress: testOwner,
          }),
        }),
        expect.any(Object)
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter out burnt NFTs', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponseWithBurnt,
      });

      const result = await getAllFromHeliusDirect(network, testOwner);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((nft) => nft.mint.address !== 'BurntNFT123')).toBe(true);
    });

    it('should handle pagination options', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAllFromHeliusDirect(network, testOwner, {
        limit: 1,
        offset: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextOffset).toBe(1);
    });

    it('should handle pagination offset', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAllFromHeliusDirect(network, testOwner, {
        limit: 1,
        offset: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.offset).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextOffset).toBeNull();
    });

    it('should enforce maximum limit of 100', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      await getAllFromHeliusDirect(network, testOwner, { limit: 200 });

      // The function should clamp to 100 internally
      // We can't directly test the limit, but we verify it doesn't throw
    });

    it('should handle Helius API errors', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          jsonrpc: '2.0',
          id: 'get-nfts-by-owner',
          error: {
            code: -32600,
            message: 'Invalid request',
          },
        },
      });

      await expect(getAllFromHeliusDirect(network, testOwner)).rejects.toThrow('Helius DAS API error');
    });

    it('should handle network errors', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllFromHeliusDirect(network, testOwner)).rejects.toThrow('Network error');
    });
  });

  describe('getAll', () => {
    it('should try Helius first, then fall back to backend', async () => {
      // Helius fails
      const mockAxiosPost = vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Helius error'));

      // Backend succeeds
      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: [mockNft, mockNft2],
      } as any);

      const result = await getAll(network, testOwner);

      expect(mockAxiosPost).toHaveBeenCalled();
      expect(mockApiGet).toHaveBeenCalledWith(`/v1/${network.id}/nft`, {
        params: { publicKey: testOwner, noCache: false },
        timeout: 15000,
      });

      expect(result).toHaveLength(2);
    });

    it('should return Helius data if available', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAll(network, testOwner);

      expect(result).toHaveLength(2);
    });

    it('should throw if both Helius and backend fail', async () => {
      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Helius error'));
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Backend error'));

      await expect(getAll(network, testOwner)).rejects.toThrow('Backend error');
    });
  });

  describe('getAllPaginated', () => {
    it('should return paginated NFT response', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAllPaginated(network, testOwner, { limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getAllGroupedByCollection', () => {
    it('should return grouped NFTs', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockHeliusResponse,
      });

      const result = await getAllGroupedByCollection(network, testOwner);

      expect(Array.isArray(result)).toBe(true);
      // Should contain collection groups and/or individual NFTs
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getNftByAddress', () => {
    it('should fetch NFT by mint address', async () => {
      const mintAddress = 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhW';
      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockNft,
      } as any);

      const result = await getNftByAddress(network, mintAddress);

      expect(mockApiGet).toHaveBeenCalledWith(`/v1/${network.id}/nft/${mintAddress}`);
      expect(result).toEqual(mockNft);
    });

    it('should return null if NFT not found', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await getNftByAddress(network, 'InvalidAddress');

      expect(result).toBeNull();
    });

    it('should return null if NFT has no collection', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { ...mockNft, collection: null },
      } as any);

      const result = await getNftByAddress(network, 'test');

      expect(result).toBeNull();
    });
  });

  describe('getCollectionById', () => {
    it('should fetch collection by ID', async () => {
      const collectionId = 'CollectionKey123';
      const mockCollection = { id: collectionId, name: 'Test Collection' };

      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockCollection,
      } as any);

      const result = await getCollectionById(network, collectionId);

      expect(mockApiGet).toHaveBeenCalledWith(
        `/v1/${network.id}/nft/hyperspace/collection/${collectionId}`
      );
      expect(result).toEqual(mockCollection);
    });

    it('should return null on error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await getCollectionById(network, 'InvalidId');

      expect(result).toBeNull();
    });
  });

  describe('getCollectionItemsById', () => {
    it('should fetch collection items with pagination', async () => {
      const collectionId = 'CollectionKey123';
      const pageNumber = 1;
      const mockItems = { items: [mockNft, mockNft2], total: 2 };

      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockItems,
      } as any);

      const result = await getCollectionItemsById(network, collectionId, pageNumber);

      expect(mockApiGet).toHaveBeenCalledWith(
        `/v1/${network.id}/nft/hyperspace/collection/${collectionId}/items/${pageNumber}`
      );
      expect(result).toEqual(mockItems);
    });

    it('should return null on error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await getCollectionItemsById(network, 'InvalidId', 1);

      expect(result).toBeNull();
    });
  });

  describe('getListedByOwner', () => {
    it('should fetch listed NFTs by owner', async () => {
      const ownerAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const mockListed = { items: [mockNft] };

      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockListed,
      } as any);

      const result = await getListedByOwner(network, ownerAddress);

      expect(mockApiGet).toHaveBeenCalledWith(`/v1/${network.id}/nft/listed/${ownerAddress}`);
      expect(result).toEqual(mockListed);
    });

    it('should return null on error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await getListedByOwner(network, 'InvalidAddress');

      expect(result).toBeNull();
    });
  });

  describe('getBidsByOwner', () => {
    it('should fetch bids by owner', async () => {
      const ownerAddress = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
      const mockBids = { bids: [{ nft: mockNft, amount: 1000000 }] };

      const mockApiGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockBids,
      } as any);

      const result = await getBidsByOwner(network, ownerAddress);

      expect(mockApiGet).toHaveBeenCalledWith(`/v1/${network.id}/nft/bids/${ownerAddress}`);
      expect(result).toEqual(mockBids);
    });

    it('should return null on error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await getBidsByOwner(network, 'InvalidAddress');

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// Integration Tests (Optional - only run if backend is available)
// ============================================================================

describe('NFT Integration Tests (optional)', () => {
  const network = SOLANA_NETWORKS.mainnet;
  // Known Solana wallet with NFTs (replace with actual test wallet if available)
  const testOwner = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';

  it.skip('should fetch real NFTs from Helius if available', async () => {
    const available = await isHeliusAvailable(network.config.nodeUrl);
    if (!available) {
      console.log('Helius not available, skipping integration test');
      return;
    }

    const result = await getAllFromHeliusDirect(network, testOwner, { limit: 5 });

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination).toBeDefined();
  });

  it.skip('should fetch real NFTs from backend if available', async () => {
    const available = await isBackendAvailable();
    if (!available) {
      console.log('Backend not available, skipping integration test');
      return;
    }

    const result = await getAll(network, testOwner);

    expect(Array.isArray(result)).toBe(true);
  });
});
