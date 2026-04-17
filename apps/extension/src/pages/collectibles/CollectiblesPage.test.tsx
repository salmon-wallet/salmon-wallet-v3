/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CollectiblesPage } from './CollectiblesPage';

const mockGetAllNfts = vi.fn();
const mockCanonicalNftToSolanaNftData = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock('../../utils/styled', () => ({
  styled: (_component: unknown) => () => {
    const React = require('react');
    return ({ children, ...props }: { children?: React.ReactNode }) => React.createElement('div', props, children);
  },
}));

vi.mock('@salmon/shared', () => ({
  colors: {
    text: { primary: '#fff', secondary: '#aaa', disabled: '#666' },
    background: { card: '#111' },
  },
  spacing: { sm: 8, md: 12, lg: 16, xl: 24 },
  fontSize: { sm: 14, base: 16, md: 18, lg: 20 },
  borderRadius: { lg: 16 },
  fontFamily: { sans: 'sans-serif' },
  componentSizes: {},
  SOLANA_NETWORKS: {
    'solana-mainnet': { id: 'solana-mainnet' },
    'solana-devnet': { id: 'solana-devnet' },
  },
  canonicalNftToSolanaNftData: (...args: unknown[]) => mockCanonicalNftToSolanaNftData(...args),
  filterSpamNfts: (nfts: unknown[]) => nfts,
  getNftSectionTitle: () => 'Solana',
  INITIAL_NFT_SECTIONS: {
    solana: { nfts: [], loading: false, blockchain: 'solana', isTestnet: false },
    'solana-devnet': { nfts: [], loading: false, blockchain: 'solana', networkLabel: 'Devnet', isTestnet: true },
  },
  getAllNfts: (...args: unknown[]) => mockGetAllNfts(...args),
  getSolanaNfts: vi.fn(),
}));

vi.mock('@/components', () => ({
  NftCard: ({ nft }: { nft: { name: string } }) => <div>{nft.name}</div>,
  NftCardSkeleton: () => <div>Loading...</div>,
  SolanaSvgIcon: () => <div />,
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

describe('CollectiblesPage burn refresh', () => {
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
      <CollectiblesPage
        activeAccount={mockAccount as any}
        developerNetworks={false}
        refreshKey={0}
      />
    );

    await screen.findByText('Burned NFT');
    expect(mockGetAllNfts).toHaveBeenCalledTimes(1);
    expect(mockGetAllNfts.mock.calls[0]?.[2]).toBe(false);

    rerender(
      <CollectiblesPage
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
