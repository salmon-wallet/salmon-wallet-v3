import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import CollectiblesScreen from '../app/(app)/(tabs)/collectibles';

const mockCreateBurnTransaction = jest.fn();
const mockSignAndSendPreparedSolanaTransactions = jest.fn();
const mockUseSolanaNftsRefresh = jest.fn();
const mockUseSolanaNfts = jest.fn();
const mockCanonicalNftToSolanaNftData = jest.fn();
const mockUseAccountsContext = jest.fn();
const mockInvalidateAfterTx = jest.fn();

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
  getNftSectionTitle: () => 'Solana',
  getShortAddress: () => 'Owne...r111',
  ms: (value: number) => value,
  s: (value: number) => value,
  useAccountsContext: () => mockUseAccountsContext(),
  useInvalidateAfterTx: () => mockInvalidateAfterTx,
  useSolanaNfts: (...args: unknown[]) => mockUseSolanaNfts(...args),
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
    mockInvalidateAfterTx.mockResolvedValue(undefined);
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

    // useSolanaNfts hook returns the canonical NFT list and a refresh()
    // function. Burn flow must call refresh() to clear stale cache.
    mockUseSolanaNftsRefresh.mockResolvedValue(undefined);
    mockUseSolanaNfts.mockImplementation(({ networkId }: { networkId: string }) => ({
      nfts: networkId === 'solana-mainnet' ? [mockRawNft] : [],
      loading: false,
      error: null,
      isError: false,
      refresh: mockUseSolanaNftsRefresh,
    }));
  });

  it('refreshes the NFT list after a burn succeeds so stale entries do not linger', async () => {
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
      // After burn the cache invalidation must fire so stale NFT entries
      // are refetched by react-query (replaces the previous manual refresh()).
      expect(mockInvalidateAfterTx).toHaveBeenCalledWith(
        expect.objectContaining({
          kinds: expect.arrayContaining(['balance', 'transactions', 'nfts']),
        }),
      );
    });
  });
});
