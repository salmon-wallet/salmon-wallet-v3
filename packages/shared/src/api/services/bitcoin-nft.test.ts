import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BitcoinOrdinal } from '../../types/nft';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');

  return {
    ...actual,
    get: vi.fn(),
  };
});

import { get } from '../client';
import { getBitcoinOrdinalById, getBitcoinOrdinals } from './bitcoin-nft';

const mockGet = vi.mocked(get);

const MOCK_ORDINAL: BitcoinOrdinal = {
  standard: 'ORDINAL',
  inscriptionId: 'inscription-id-1',
  inscriptionNumber: 1,
  mint: 'inscription-id-1',
  owner: 'bc1powneraddress',
  name: 'Test Ordinal',
  description: 'Ordinal test asset',
  contentType: 'image/png',
  uri: 'https://example.com/ordinal/1',
  media: 'https://example.com/ordinal/1.png',
  satRarity: 'common',
  collection: {
    name: 'Test Collection',
    slug: 'test-collection',
  },
  extras: {
    sat: 123,
    genesisTransaction: 'genesis-tx',
    genesisHeight: 840000,
    output: 'genesis-tx:0',
    outputValue: 546,
    attributes: [
      {
        trait_type: 'Background',
        value: 'Blue',
      },
    ],
  },
};

describe('bitcoin nft service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ordinals for a bitcoin owner address', async () => {
    mockGet.mockResolvedValueOnce([MOCK_ORDINAL]);

    const result = await getBitcoinOrdinals(
      'bitcoin-mainnet',
      'bc1powneraddress',
    );

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/bitcoin-mainnet/nft?owner=bc1powneraddress',
    );
    expect(result).toEqual([MOCK_ORDINAL]);
  });

  it('returns an empty array when ordinal owner lookup fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('backend unavailable'));

    const result = await getBitcoinOrdinals(
      'bitcoin-mainnet',
      'bc1powneraddress',
    );

    expect(result).toEqual([]);
  });

  it('fetches a single ordinal by inscription id', async () => {
    mockGet.mockResolvedValueOnce(MOCK_ORDINAL);

    const result = await getBitcoinOrdinalById(
      'bitcoin-mainnet',
      'inscription-id-1',
    );

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/bitcoin-mainnet/nft/inscription-id-1',
    );
    expect(result).toEqual(MOCK_ORDINAL);
  });

  it('returns null when ordinal detail lookup fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('not found'));

    const result = await getBitcoinOrdinalById(
      'bitcoin-mainnet',
      'inscription-id-1',
    );

    expect(result).toBeNull();
  });
});
