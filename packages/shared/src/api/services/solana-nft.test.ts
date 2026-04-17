import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '../client';
import { getSolanaNfts } from './solana-nft';

const mockApiClientGet = vi.mocked(apiClient.get);

describe('solana-nft service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the noCache flag to the backend owner NFT endpoint', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            mint: 'Mint111',
            owner: 'Owner111',
            name: 'Alpha',
            symbol: 'ALPHA',
            media: 'https://example.com/alpha.png',
            collection: { name: 'Collection', key: 'collection-key', verified: true },
          },
        ],
      },
    });

    const result = await getSolanaNfts('solana-mainnet', 'Owner111', true);

    expect(mockApiClientGet).toHaveBeenCalledWith('/v1/solana-mainnet/nft', {
      params: { publicKey: 'Owner111', noCache: true },
      timeout: 15000,
    });
    expect(result).toEqual([
      expect.objectContaining({
        mint: { address: 'Mint111' },
        owner: 'Owner111',
        name: 'Alpha',
        media: 'https://example.com/alpha.png',
      }),
    ]);
  });

  it('filters NFTs that have no usable media after normalization', async () => {
    mockApiClientGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            mint: 'Mint111',
            owner: 'Owner111',
            name: 'Visible NFT',
            media: 'https://example.com/visible.png',
          },
          {
            mint: 'Mint222',
            owner: 'Owner111',
            name: 'Hidden NFT',
            media: null,
          },
        ],
      },
    });

    const result = await getSolanaNfts('solana-mainnet', 'Owner111', false);

    expect(result).toHaveLength(1);
    expect(result[0]?.mint.address).toBe('Mint111');
  });
});
