import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MarketplaceTransactionResponse,
  NftBid,
  NftListing,
} from '../../types/nft';
import type { SolanaNetwork } from '../../types/blockchain';

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

import { ApiError, apiClient } from '../client';
import { getReachableBackendBaseUrl } from '../test-backend';
import {
  createBidTransaction,
  createBurnTransaction,
  createBuyTransaction,
  createCancelBidTransaction,
  createListingTransaction,
  createUnlistTransaction,
  getBidsByOwner,
  getCollectionById,
  getCollectionGroupByFilter,
  getCollectionItemsById,
  getListedByOwner,
  getUserBids,
  getUserListings,
} from './marketplace';

const mockApiClientGet = vi.mocked(apiClient.get);
const mockApiClientPost = vi.mocked(apiClient.post);
const backendBaseUrl = await getReachableBackendBaseUrl();

const MOCK_NETWORK: SolanaNetwork = {
  id: 'solana-mainnet',
  blockchain: 'solana',
  name: 'Solana',
  isTestnet: false,
  nativeToken: {
    chainId: 'solana-mainnet:solana',
    networkId: 'solana-mainnet',
    tokenId: 'native',
    type: 'native',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    image: '',
  },
};

const MOCK_TRANSACTION: MarketplaceTransactionResponse = {
  transaction: 'base64-serialized-transaction',
  message: 'ready',
};

const MOCK_MULTI_STEP_TRANSACTION: MarketplaceTransactionResponse = {
  transactions: [
    {
      transaction: 'base64-step-1',
      step: 'createLookupTable',
    },
  ],
  lookupTable: {
    required: true,
    estimatedRentLamports: 1000,
    estimatedRentSol: 0.000001,
    addressCount: 32,
    extendTransactionCount: 1,
  },
};

const MOCK_LISTINGS: NftListing[] = [
  {
    tokenAddress: 'mint-1',
    sellerAddress: 'owner-1',
    price: 1.25,
    marketplace: 'hyperspace',
    metadata: {
      name: 'Listing NFT',
      image: 'https://example.com/listing.png',
      collection: 'Collection One',
    },
  },
];

const MOCK_BIDS: NftBid[] = [
  {
    tokenAddress: 'mint-2',
    buyerAddress: 'owner-1',
    price: 0.85,
    marketplace: 'hyperspace',
    metadata: {
      name: 'Bid NFT',
      image: 'https://example.com/bid.png',
      collection: 'Collection Two',
    },
  },
];

describe('marketplace service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards listing params to the list transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createListingTransaction({
      tokenAddress: 'mint-1',
      sellerAddress: 'seller-1',
      price: 1.5,
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/list-tx', {
      params: {
        tokenAddress: 'mint-1',
        sellerAddress: 'seller-1',
        price: 1.5,
      },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('forwards unlist params to the unlist transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createUnlistTransaction({
      tokenAddress: 'mint-1',
      sellerAddress: 'seller-1',
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/unlist-tx', {
      params: {
        tokenAddress: 'mint-1',
        sellerAddress: 'seller-1',
      },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('forwards buy params to the buy transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createBuyTransaction({
      tokenAddress: 'mint-1',
      buyerAddress: 'buyer-1',
      price: 2,
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/buy-tx', {
      params: {
        tokenAddress: 'mint-1',
        buyerAddress: 'buyer-1',
        price: 2,
      },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('forwards bid params to the bid transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createBidTransaction({
      tokenAddress: 'mint-1',
      buyerAddress: 'buyer-1',
      price: 0.9,
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/bid-tx', {
      params: {
        tokenAddress: 'mint-1',
        buyerAddress: 'buyer-1',
        price: 0.9,
      },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('forwards cancel bid params to the cancel bid transaction endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createCancelBidTransaction({
      tokenAddress: 'mint-1',
      buyerAddress: 'buyer-1',
    });

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/cancel-bid-tx', {
      params: {
        tokenAddress: 'mint-1',
        buyerAddress: 'buyer-1',
      },
    });
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('posts burn params and accepts single transaction responses', async () => {
    mockApiClientPost.mockResolvedValueOnce({ data: MOCK_TRANSACTION });

    const result = await createBurnTransaction({
      mintAddress: 'mint-1',
      ownerAddress: 'owner-1',
    });

    expect(mockApiClientPost).toHaveBeenCalledWith(
      '/v1/solana-mainnet/nft/mint-1',
      undefined,
      {
        params: {
          owner: 'owner-1',
        },
      },
    );
    expect(result).toEqual(MOCK_TRANSACTION);
  });

  it('accepts multi-step burn transaction responses', async () => {
    mockApiClientPost.mockResolvedValueOnce({ data: MOCK_MULTI_STEP_TRANSACTION });

    const result = await createBurnTransaction({
      mintAddress: 'mint-2',
      ownerAddress: 'owner-2',
    });

    expect(result).toEqual(MOCK_MULTI_STEP_TRANSACTION);
  });

  it('throws when burn response does not contain any transaction payload', async () => {
    mockApiClientPost.mockResolvedValueOnce({ data: { message: 'missing tx' } });

    await expect(
      createBurnTransaction({
        mintAddress: 'mint-3',
        ownerAddress: 'owner-3',
      }),
    ).rejects.toThrow('Burn transaction was not returned by the API');
  });

  it('returns listings when the backend resolves them', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_LISTINGS });

    const result = await getUserListings('owner-1');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/listed/owner-1');
    expect(result).toEqual(MOCK_LISTINGS);
  });

  it('returns an empty array for missing user listings', async () => {
    mockApiClientGet.mockRejectedValueOnce(new ApiError('Not found', 404, 'not_found'));

    const result = await getUserListings('missing-owner');

    expect(result).toEqual([]);
  });

  it('returns bids when the backend resolves them', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_BIDS });

    const result = await getUserBids('owner-1');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/bids/owner-1');
    expect(result).toEqual(MOCK_BIDS);
  });

  it('returns an empty array for missing user bids', async () => {
    mockApiClientGet.mockRejectedValueOnce(new ApiError('Not found', 404, 'not_found'));

    const result = await getUserBids('missing-owner');

    expect(result).toEqual([]);
  });

  it('returns collection group data when available', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: { collections: ['a'] } });

    const result = await getCollectionGroupByFilter(MOCK_NETWORK, 'trending');

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/nft/hyperspace/collections/trending',
    );
    expect(result).toEqual({ collections: ['a'] });
  });

  it('returns null when collection group lookup fails', async () => {
    mockApiClientGet.mockRejectedValueOnce(new Error('backend unavailable'));

    await expect(getCollectionGroupByFilter(MOCK_NETWORK, 'trending')).resolves.toBeNull();
  });

  it('returns collection details when available', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: { id: 'collection-1' } });

    const result = await getCollectionById(MOCK_NETWORK, 'collection-1');

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/nft/hyperspace/collection/collection-1',
    );
    expect(result).toEqual({ id: 'collection-1' });
  });

  it('returns paginated collection items when available', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: { items: ['mint-1'] } });

    const result = await getCollectionItemsById(MOCK_NETWORK, 'collection-1', 2);

    expect(mockApiClientGet).toHaveBeenCalledWith(
      '/v1/solana-mainnet/nft/hyperspace/collection/collection-1/items/2',
    );
    expect(result).toEqual({ items: ['mint-1'] });
  });

  it('returns listed items by owner when available', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_LISTINGS });

    const result = await getListedByOwner(MOCK_NETWORK, 'owner-1');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/listed/owner-1');
    expect(result).toEqual(MOCK_LISTINGS);
  });

  it('returns null when listed items by owner lookup fails', async () => {
    mockApiClientGet.mockRejectedValueOnce(new Error('backend unavailable'));

    await expect(getListedByOwner(MOCK_NETWORK, 'owner-1')).resolves.toBeNull();
  });

  it('returns bids by owner when available', async () => {
    mockApiClientGet.mockResolvedValueOnce({ data: MOCK_BIDS });

    const result = await getBidsByOwner(MOCK_NETWORK, 'owner-1');

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft/bids/owner-1');
    expect(result).toEqual(MOCK_BIDS);
  });

  it('returns null when bids by owner lookup fails', async () => {
    mockApiClientGet.mockRejectedValueOnce(new Error('backend unavailable'));

    await expect(getBidsByOwner(MOCK_NETWORK, 'owner-1')).resolves.toBeNull();
  });
});

describe.skipIf(!backendBaseUrl)('marketplace service integration', () => {
  const ownerAddress = '11111111111111111111111111111111';

  it(
    'reads live listed nfts endpoint from salmon-api and normalizes unavailable owners to arrays',
    async () => {
      mockApiClientGet.mockImplementation(async (path) => {
        const response = await fetch(`${backendBaseUrl!}${path as string}`, {
          method: 'GET',
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }

        return {
          data: await response.json(),
        } as { data: NftListing[] };
      });

      const result = await getUserListings(ownerAddress);

      expect(Array.isArray(result)).toBe(true);
    },
    20000,
  );

  it(
    'reads live user bids endpoint from salmon-api and normalizes unavailable owners to arrays',
    async () => {
      mockApiClientGet.mockImplementation(async (path) => {
        const response = await fetch(`${backendBaseUrl!}${path as string}`, {
          method: 'GET',
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }

        return {
          data: await response.json(),
        } as { data: NftBid[] };
      });

      const result = await getUserBids(ownerAddress);

      expect(Array.isArray(result)).toBe(true);
    },
    20000,
  );
});
