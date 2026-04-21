import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EthereumNft } from '../../types/nft';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    get: vi.fn(),
  };
});

import { get } from '../client';
import { getEthereumNftById, getEthereumNfts } from './ethereum-nft';

const mockGet = vi.mocked(get);

const MOCK_ETHEREUM_NFT: EthereumNft = {
  standard: 'ERC721',
  contract: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  mint: '1',
  owner: '0xowner',
  name: 'Ethereum Name Service',
  description: 'ENS NFT',
  symbol: 'ENS',
  uri: 'https://example.com/1',
  media: 'https://example.com/1.png',
  collection: {
    name: 'ENS',
    slug: 'ens',
  },
  extras: {
    attributes: [
      {
        trait_type: 'Length',
        value: 3,
      },
    ],
  },
};

describe('ethereum nft service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ethereum nfts for an owner address', async () => {
    mockGet.mockResolvedValueOnce([MOCK_ETHEREUM_NFT]);

    const result = await getEthereumNfts(
      'ethereum-mainnet',
      '0x1234567890123456789012345678901234567890',
    );

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/ethereum-mainnet/nft?owner=0x1234567890123456789012345678901234567890',
    );
    expect(result).toEqual([MOCK_ETHEREUM_NFT]);
  });

  it('returns an empty array when ethereum nft owner lookup fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('backend unavailable'));

    const result = await getEthereumNfts(
      'ethereum-mainnet',
      '0x1234567890123456789012345678901234567890',
    );

    expect(result).toEqual([]);
  });

  it('fetches a single ethereum nft by contract and token id', async () => {
    mockGet.mockResolvedValueOnce(MOCK_ETHEREUM_NFT);

    const result = await getEthereumNftById(
      'ethereum-mainnet',
      '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      '1',
    );

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/ethereum-mainnet/nft/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85/1',
    );
    expect(result).toEqual(MOCK_ETHEREUM_NFT);
  });

  it('returns null when ethereum nft detail lookup fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'));

    const result = await getEthereumNftById(
      'ethereum-mainnet',
      '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      '1',
    );

    expect(result).toBeNull();
  });
});
