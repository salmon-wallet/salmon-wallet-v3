import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CollectiblesScreen from '../app/(app)/(tabs)/collectibles';

const mockCreateBurnTransaction = jest.fn();
const mockSignAndSendPreparedSolanaTransactions = jest.fn();
const mockGetAllNfts = jest.fn();
const mockCanonicalNftToSolanaNftData = jest.fn();
const mockUseAccountsContext = jest.fn();

const mockRawNft = {
  mint: { address: 'Mint111' },
  owner: 'Owner111',
  name: 'Burnable NFT',
  symbol: 'BURN',
  uri: '',
  json: {},
  updateAuthorityAddress: null,
  sellerFeeBasisPoints: 0,
  collection: null,
  edition: null,
  tokenStandard: 'NonFungible',
  media: 'https://example.com/nft.png',
  description: '',
  compressed: false,
  extras: {
    attributes: [],
    properties: {},
    creators: [],
  },
  extensions: [],
};

const mockNftData = {
  mint: 'Mint111',
  name: 'Burnable NFT',
  image: 'https://example.com/nft.png',
  media: 'https://example.com/nft.png',
  blockchain: 'solana',
};

jest.mock('@salmon/shared', () => ({
  SECTION_TO_NETWORK: {
    solana: 'solana-mainnet',
    'solana-devnet': 'solana-devnet',
  },
  SOLANA_NETWORKS: {
    'solana-mainnet': { id: 'solana-mainnet' },
    'solana-devnet': { id: 'solana-devnet' },
  },
  SolanaAccount: class {},
  canonicalNftToSolanaNftData: (...args: unknown[]) => mockCanonicalNftToSolanaNftData(...args),
  borderRadius: { md: 12 },
  colors: {
    accent: { primary: '#00ff99', tint: '#003322', border: '#00aa66' },
    text: { primary: '#fff', muted: '#999' },
  },
  createBurnTransaction: (...args: unknown[]) => mockCreateBurnTransaction(...args),
  fontFamilyNative: { semiBold: 'System', medium: 'System' },
  fontSize: { md: 16, sm: 14, xl: 20 },
  signAndSendPreparedSolanaTransactions: (...args: unknown[]) => mockSignAndSendPreparedSolanaTransactions(...args),
  letterSpacing: { wide: 0, wider: 0 },
  spacing: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, headerPadding: 16 },
  getAllNfts: (...args: unknown[]) => mockGetAllNfts(...args),
  getNftSectionTitle: () => 'Solana',
  getShortAddress: () => 'Owne...r111',
  getSolanaNfts: jest.fn(),
  ms: (value: number) => value,
  s: (value: number) => value,
  useAccountsContext: () => mockUseAccountsContext(),
  vs: (value: number) => value,
}));

jest.mock('../src/components', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    NftCard: ({ nft, onPress }: { nft: { name: string }; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{nft.name}</Text>
      </Pressable>
    ),
    NftCardSkeleton: () => <View />,
    NftDetailSheet: ({
      visible,
      onBurnPress,
      onBurnConfirm,
    }: {
      visible: boolean;
      onBurnPress: () => void;
      onBurnConfirm: () => void;
    }) => (visible ? (
      <View>
        <Pressable accessibilityRole="button" onPress={onBurnPress}>
          <Text>Prepare Burn</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBurnConfirm}>
          <Text>Confirm Burn</Text>
        </Pressable>
      </View>
    ) : null),
    SolanaSvgIcon: () => <View />,
    SubAccountSelector: () => <View />,
  };
});

jest.mock('../src/contexts/DeveloperModeContext', () => ({
  useDeveloperMode: () => false,
}));

jest.mock('../hooks/useTabChrome', () => ({
  useTabChrome: () => ({
    headerContentOffset: 0,
    scrollBottomPadding: 0,
  }),
}));

describe('Collectibles burn reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCanonicalNftToSolanaNftData.mockReturnValue(mockNftData);
    mockCreateBurnTransaction.mockResolvedValue({
      transaction: 'burn-transaction',
    });
    mockSignAndSendPreparedSolanaTransactions.mockResolvedValue(['signature-111']);
    mockUseAccountsContext.mockReturnValue([
      {
        ready: true,
        activeBlockchainAccount: { id: 'active-solana-account' },
        activeAccount: {
          networksAccounts: {
            'solana-mainnet': [
              {
                getReceiveAddress: () => 'Owner111',
              },
            ],
          },
        },
      },
    ]);

    // Simulate a stale source that still returns the burned NFT unless callers
    // explicitly bypass cache with noCache=true.
    mockGetAllNfts.mockImplementation(
      async (_network: unknown, _owner: string, noCache: boolean) => (noCache ? [] : [mockRawNft])
    );
  });

  it('re-fetches owner NFTs without cache after burn succeeds so stale owner lists do not keep the burned NFT visible', async () => {
    render(<CollectiblesScreen />);

    await screen.findByText('Burnable NFT');

    fireEvent.press(screen.getByText('Burnable NFT'));
    fireEvent.press(screen.getByText('Prepare Burn'));

    await waitFor(() => {
      expect(mockCreateBurnTransaction).toHaveBeenCalledWith(
        { mintAddress: 'Mint111', ownerAddress: 'Owner111' },
        'solana-mainnet',
      );
    });

    fireEvent.press(screen.getByText('Confirm Burn'));

    await waitFor(() => {
      expect(mockSignAndSendPreparedSolanaTransactions).toHaveBeenCalledTimes(1);
      expect(mockGetAllNfts).toHaveBeenCalledTimes(2);
    });

    expect(mockGetAllNfts.mock.calls[1]?.[2]).toBe(true);
  });
});
