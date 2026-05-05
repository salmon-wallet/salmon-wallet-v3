/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CollectiblesTab } from './CollectiblesTab';

const mockGetAllNfts = vi.fn();
const mockCanonicalNftToSolanaNftData = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('@salmon/ui', () => ({
  styled: (_component: unknown) => () => {
    const React = require('react');
    return ({ children, ...props }: { children?: React.ReactNode }) => React.createElement('div', props, children);
  },
  NftCarouselSection: ({ title, nfts }: { title: string; nfts: Array<{ name: string }> }) => (
    <div>
      <div>{title}</div>
      {nfts.map((nft) => <div key={nft.name}>{nft.name}</div>)}
    </div>
  ),
}));

vi.mock('@salmon/shared', () => ({
  colors: {
    text: { secondary: '#aaa' },
  },
  spacing: { lg: 16, '2xl': 24, md: 12, sm: 8 },
  fontFamily: { sans: 'sans-serif' },
  canonicalNftToSolanaNftData: (...args: unknown[]) => mockCanonicalNftToSolanaNftData(...args),
  getNftSectionTitle: () => 'Solana',
  INITIAL_NFT_SECTIONS: {
    solana: { nfts: [], loading: false, blockchain: 'solana', isTestnet: false },
    'solana-devnet': { nfts: [], loading: false, blockchain: 'solana', networkLabel: 'Devnet', isTestnet: true },
  },
  SOLANA_NETWORKS: {
    'solana-mainnet': { id: 'solana-mainnet' },
    'solana-devnet': { id: 'solana-devnet' },
  },
  getAllNfts: (...args: unknown[]) => mockGetAllNfts(...args),
  getSolanaNfts: vi.fn(),
  isSolanaAccount: () => true,
}));

const mockRawNft = {
  mint: { address: 'Mint111' },
  owner: 'Owner111',
  name: 'Burned NFT',
  media: 'https://example.com/nft.png',
};

const mockAccount = {
  networksAccounts: {
    'solana-mainnet': [
      {
        getReceiveAddress: () => 'Owner111',
      },
    ],
  },
};

describe('CollectiblesTab burn refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanonicalNftToSolanaNftData.mockReturnValue({
      mint: 'Mint111',
      name: 'Burned NFT',
      media: 'https://example.com/nft.png',
      blockchain: 'solana',
    });
    mockGetAllNfts.mockImplementation(async (_network: unknown, _owner: string, noCache: boolean) => (
      noCache ? [] : [mockRawNft]
    ));
  });

  it('re-fetches owner NFTs with noCache when refreshKey changes after a burn flow', async () => {
    const { rerender } = render(
      <CollectiblesTab
        activeAccount={mockAccount as any}
        developerNetworks={false}
        refreshKey={0}
      />
    );

    await screen.findByText('Burned NFT');
    expect(mockGetAllNfts).toHaveBeenCalledTimes(1);
    expect(mockGetAllNfts.mock.calls[0]?.[2]).toBe(false);

    rerender(
      <CollectiblesTab
        activeAccount={mockAccount as any}
        developerNetworks={false}
        refreshKey={1}
      />
    );

    await waitFor(() => {
      expect(mockGetAllNfts).toHaveBeenCalledTimes(2);
    });

    expect(mockGetAllNfts.mock.calls[1]?.[2]).toBe(true);
  });
});
