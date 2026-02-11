/**
 * CollectiblesScreen - NFT Gallery (Netflix-Style)
 *
 * Displays NFTs grouped by blockchain in horizontal carousels.
 * - Always shows mainnet NFTs for all blockchains
 * - When developer mode is enabled, also shows devnet/testnet NFTs
 *
 * Features:
 * - Pull-to-refresh
 * - Loading skeleton state
 * - Empty state
 * - "See All" sheets for each blockchain
 * - Parallel multi-chain fetching
 * - Developer mode support for test networks
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAccountsContext,
  useUserConfig,
  colors,
  componentSizes,
  vs,
  s,
  ms,
  getAllNfts,
  getSolanaNfts,
  type Nft,
  SOLANA_NETWORKS,
  getEthereumNfts,
  getBitcoinOrdinals,
  ethereumNftToNftData,
  bitcoinOrdinalToNftData,
  type EthereumNft,
  type BitcoinOrdinal,
  getShortAddress,
} from '@salmon/shared';
import {
  NftCarouselSection,
  NftCarouselSectionSkeleton,
  NftSeeAllSheet,
  NftDetailSheet,
  SubAccountSelector,
  type SubAccount,
  type NftData,
  type NftBlockchain,
  type NftDetailData,
} from '../../../src/components';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended blockchain key that includes network suffix for devnet/testnet
 */
type NftSectionKey =
  | 'solana'
  | 'solana-devnet'
  | 'ethereum'
  | 'ethereum-sepolia'
  | 'bitcoin';

interface NftSection {
  nfts: NftData[];
  raw: Nft[] | EthereumNft[] | BitcoinOrdinal[];
  loading: boolean;
  blockchain: NftBlockchain;
  networkLabel?: string; // e.g., "Devnet", "Sepolia"
  isTestnet: boolean;
}

type NftsBySection = Record<NftSectionKey, NftSection>;

interface SeeAllSheetState {
  visible: boolean;
  sectionKey: NftSectionKey | null;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Maps each UI section to its network account key in networksAccounts.
 */
const SECTION_TO_NETWORK: Record<NftSectionKey, string> = {
  'solana': 'solana-mainnet',
  'solana-devnet': 'solana-devnet',
  'ethereum': 'ethereum-mainnet',
  'ethereum-sepolia': 'ethereum-sepolia',
  'bitcoin': 'bitcoin-mainnet',
};

const INITIAL_SECTION_INDEXES: Record<NftSectionKey, number> = {
  'solana': 0,
  'solana-devnet': 0,
  'ethereum': 0,
  'ethereum-sepolia': 0,
  'bitcoin': 0,
};

const INITIAL_SECTIONS: NftsBySection = {
  solana: { nfts: [], raw: [], loading: true, blockchain: 'solana', isTestnet: false },
  'solana-devnet': { nfts: [], raw: [], loading: false, blockchain: 'solana', networkLabel: 'Devnet', isTestnet: true },
  ethereum: { nfts: [], raw: [], loading: true, blockchain: 'ethereum', isTestnet: false },
  'ethereum-sepolia': { nfts: [], raw: [], loading: false, blockchain: 'ethereum', networkLabel: 'Sepolia', isTestnet: true },
  bitcoin: { nfts: [], raw: [], loading: true, blockchain: 'bitcoin', isTestnet: false },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Solana Nft to NftData for UI components
 */
function solanaNftToNftData(nft: Nft): NftData {
  return {
    blockchain: 'solana',
    mint: nft.mint.address,
    name: nft.name || 'Unnamed NFT',
    image: nft.media || undefined,
    collectionName: nft.collection?.name || undefined,
  };
}

/**
 * Convert Solana Nft to NftDetailData for detail sheet
 */
function solanaNftToDetailData(nft: Nft): NftDetailData {
  return {
    blockchain: 'solana',
    mint: nft.mint.address,
    name: nft.name || 'Unnamed NFT',
    image: nft.media || undefined,
    description: nft.description || undefined,
    collectionName: nft.collection?.name || undefined,
    attributes: nft.extras?.attributes?.map((attr) => ({
      trait_type: attr.trait_type,
      value: String(attr.value),
    })),
  };
}

/**
 * Get section title with optional network label
 */
function getSectionTitle(sectionKey: NftSectionKey, section: NftSection): string {
  const baseNames: Record<NftBlockchain, string> = {
    solana: 'Solana',
    ethereum: 'Ethereum',
    bitcoin: 'Bitcoin Ordinals',
  };

  const baseName = baseNames[section.blockchain];
  return section.networkLabel ? `${baseName} ${section.networkLabel}` : baseName;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CollectiblesScreen() {
  // Safe area insets for header positioning
  const insets = useSafeAreaInsets();

  // NFT state grouped by section (blockchain + network)
  const [nftsBySections, setNftsBySections] = useState<NftsBySection>(INITIAL_SECTIONS);

  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [seeAllSheet, setSeeAllSheet] = useState<SeeAllSheetState>({
    visible: false,
    sectionKey: null,
  });
  const [detailSheet, setDetailSheet] = useState<{
    visible: boolean;
    nft: NftDetailData | null;
    sectionKey: NftSectionKey | null;
  }>({
    visible: false,
    nft: null,
    sectionKey: null,
  });

  // Per-section sub-account index (each blockchain section can pick its own derived account)
  const [sectionIndexes, setSectionIndexes] = useState<Record<NftSectionKey, number>>(INITIAL_SECTION_INDEXES);

  // Get account context
  const [accountState] = useAccountsContext();
  const { ready, activeBlockchainAccount, activeAccount } = accountState;

  // Get developer mode state
  const userConfigAccount = useMemo(() => ({
    network: {
      environment: 'solana-mainnet' as const,
      blockchain: 'solana' as const,
    },
  }), []);

  const { developerNetworks } = useUserConfig({
    activeBlockchainAccount: userConfigAccount,
  });

  // Calculate header offset for content
  const headerOffset = insets.top + componentSizes.headerInnerHeight;

  // Build sub-account lists per section for the SubAccountSelector
  const sectionSubAccounts = useMemo(() => {
    if (!activeAccount) return {} as Record<NftSectionKey, SubAccount[]>;

    const result = {} as Record<NftSectionKey, SubAccount[]>;
    for (const [sectionKey, networkId] of Object.entries(SECTION_TO_NETWORK)) {
      const accounts = activeAccount.networksAccounts?.[networkId] ?? [];
      result[sectionKey as NftSectionKey] = accounts
        .map((acc, idx) => acc ? {
          index: idx,
          address: getShortAddress(acc.getReceiveAddress(), 4) ?? '',
        } : null)
        .filter((item): item is SubAccount => item !== null);
    }
    return result;
  }, [activeAccount]);

  // Handle sub-account change per section → triggers refetch
  const handleSectionIndexChange = useCallback((sectionKey: NftSectionKey, index: number) => {
    setSectionIndexes((prev) => ({ ...prev, [sectionKey]: index }));
  }, []);

  // Fetch all NFTs in parallel
  const fetchAllNfts = useCallback(
    async (isRefresh = false) => {
      if (!activeBlockchainAccount || !activeAccount) return;

      // Get addresses using per-section selected sub-account index
      const solanaMainnetAccount = activeAccount.networksAccounts?.['solana-mainnet']?.[sectionIndexes['solana']];
      const solanaAddress = solanaMainnetAccount?.getReceiveAddress() ?? '';

      const solanaDevnetAccount = activeAccount.networksAccounts?.['solana-devnet']?.[sectionIndexes['solana-devnet']];
      const solanaDevnetAddress = solanaDevnetAccount?.getReceiveAddress() ?? '';

      const ethAccount = activeAccount.networksAccounts?.['ethereum-mainnet']?.[sectionIndexes['ethereum']];
      const ethAddress = ethAccount?.getReceiveAddress() ?? '';

      const btcAccount = activeAccount.networksAccounts?.['bitcoin-mainnet']?.[sectionIndexes['bitcoin']];
      const btcAddress = btcAccount?.getReceiveAddress() ?? '';

      // Set loading state for mainnet sections
      if (!isRefresh) {
        setNftsBySections((prev) => ({
          ...prev,
          solana: { ...prev.solana, loading: true },
          ethereum: { ...prev.ethereum, loading: true },
          bitcoin: { ...prev.bitcoin, loading: true },
          // Also set loading for testnet sections if developer mode is enabled
          ...(developerNetworks && {
            'solana-devnet': { ...prev['solana-devnet'], loading: true },
            'ethereum-sepolia': { ...prev['ethereum-sepolia'], loading: true },
          }),
        }));
      }

      // Build fetch promises - ALWAYS fetch mainnet
      const fetchPromises: Promise<{ key: NftSectionKey; result: Nft[] | EthereumNft[] | BitcoinOrdinal[] }>[] = [
        // Mainnet fetches (always, if address available)
        (solanaAddress
          ? getAllNfts(SOLANA_NETWORKS['solana-mainnet'], solanaAddress, false, getSolanaNfts)
          : Promise.resolve([]))
          .then((result) => ({ key: 'solana' as NftSectionKey, result }))
          .catch(() => ({ key: 'solana' as NftSectionKey, result: [] })),

        (ethAddress ? getEthereumNfts('ethereum-mainnet', ethAddress) : Promise.resolve([]))
          .then((result) => ({ key: 'ethereum' as NftSectionKey, result }))
          .catch(() => ({ key: 'ethereum' as NftSectionKey, result: [] })),

        (btcAddress ? getBitcoinOrdinals('bitcoin-mainnet', btcAddress) : Promise.resolve([]))
          .then((result) => ({ key: 'bitcoin' as NftSectionKey, result }))
          .catch(() => ({ key: 'bitcoin' as NftSectionKey, result: [] })),
      ];

      // Add testnet fetches if developer mode is enabled
      if (developerNetworks) {
        fetchPromises.push(
          // Solana Devnet
          (solanaDevnetAddress
            ? getAllNfts(SOLANA_NETWORKS['solana-devnet'], solanaDevnetAddress, false, getSolanaNfts)
            : Promise.resolve([]))
            .then((result) => ({ key: 'solana-devnet' as NftSectionKey, result }))
            .catch(() => ({ key: 'solana-devnet' as NftSectionKey, result: [] })),

          // Ethereum Sepolia (uses its own section index)
          (() => {
            const sepoliaAccount = activeAccount.networksAccounts?.['ethereum-sepolia']?.[sectionIndexes['ethereum-sepolia']];
            const sepoliaAddress = sepoliaAccount?.getReceiveAddress() ?? ethAddress;
            return sepoliaAddress ? getEthereumNfts('ethereum-sepolia', sepoliaAddress) : Promise.resolve([]);
          })()
            .then((result) => ({ key: 'ethereum-sepolia' as NftSectionKey, result }))
            .catch(() => ({ key: 'ethereum-sepolia' as NftSectionKey, result: [] })),
        );
      }

      // Fetch all in parallel
      const results = await Promise.all(fetchPromises);

      // Process results
      const newSections = { ...INITIAL_SECTIONS };

      for (const { key, result } of results) {
        const section = newSections[key];

        if (key === 'solana' || key === 'solana-devnet') {
          const solanaNfts = result as Nft[];
          newSections[key] = {
            ...section,
            nfts: solanaNfts.map(solanaNftToNftData),
            raw: solanaNfts,
            loading: false,
          };
        } else if (key === 'ethereum' || key === 'ethereum-sepolia') {
          const ethNfts = result as EthereumNft[];
          newSections[key] = {
            ...section,
            nfts: ethNfts.map(ethereumNftToNftData),
            raw: ethNfts,
            loading: false,
          };
        } else if (key === 'bitcoin') {
          const btcNfts = result as BitcoinOrdinal[];
          newSections[key] = {
            ...section,
            nfts: btcNfts.map(bitcoinOrdinalToNftData),
            raw: btcNfts,
            loading: false,
          };
        }
      }

      // If developer mode is off, ensure testnet sections are empty and not loading
      if (!developerNetworks) {
        newSections['solana-devnet'] = { ...INITIAL_SECTIONS['solana-devnet'], loading: false };
        newSections['ethereum-sepolia'] = { ...INITIAL_SECTIONS['ethereum-sepolia'], loading: false };
      }

      setNftsBySections(newSections);

      if (isRefresh) {
        setRefreshing(false);
      }
    },
    [activeAccount, activeBlockchainAccount, developerNetworks, sectionIndexes]
  );

  // Fetch on mount and when account/developer mode changes
  useEffect(() => {
    if (ready && activeBlockchainAccount && activeAccount) {
      fetchAllNfts();
    }
  }, [ready, activeBlockchainAccount, developerNetworks, fetchAllNfts]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllNfts(true);
  }, [fetchAllNfts]);

  // Handle NFT press - open detail sheet
  const handleNftPress = useCallback(
    (nftData: NftData, sectionKey: NftSectionKey) => {
      const section = nftsBySections[sectionKey];
      let detailData: NftDetailData | null = null;

      if (section.blockchain === 'solana') {
        const rawNft = (section.raw as Nft[]).find(
          (n) => n.mint.address === nftData.mint
        );
        if (rawNft) {
          detailData = solanaNftToDetailData(rawNft);
        }
      } else if (section.blockchain === 'ethereum') {
        const rawNft = (section.raw as EthereumNft[]).find(
          (n) => `${n.contract}:${n.mint}` === nftData.mint
        );
        if (rawNft) {
          detailData = ethereumNftToNftData(rawNft);
        }
      } else if (section.blockchain === 'bitcoin') {
        const rawNft = (section.raw as BitcoinOrdinal[]).find(
          (n) => n.inscriptionId === nftData.mint
        );
        if (rawNft) {
          detailData = bitcoinOrdinalToNftData(rawNft);
        }
      }

      if (detailData) {
        setDetailSheet({
          visible: true,
          nft: detailData,
          sectionKey,
        });
      }
    },
    [nftsBySections]
  );

  // Handle "See All" press - open full grid sheet
  const handleSeeAllPress = useCallback((sectionKey: NftSectionKey) => {
    setSeeAllSheet({
      visible: true,
      sectionKey,
    });
  }, []);

  // Handle detail sheet close
  const handleDetailSheetClose = useCallback(() => {
    setDetailSheet((prev) => ({ ...prev, visible: false }));
    // Clear NFT data after animation
    setTimeout(() => {
      setDetailSheet({ visible: false, nft: null, sectionKey: null });
    }, 300);
  }, []);

  // Handle see all sheet close
  const handleSeeAllSheetClose = useCallback(() => {
    setSeeAllSheet({ visible: false, sectionKey: null });
  }, []);

  // Handle Send button
  const handleSend = useCallback(() => {
    if (detailSheet.nft) {
      Alert.alert(
        'Send NFT',
        `Send "${detailSheet.nft.name}" functionality coming soon!`,
        [{ text: 'OK' }]
      );
    }
  }, [detailSheet.nft]);

  // Handle Burn button
  const handleBurn = useCallback(() => {
    if (detailSheet.nft) {
      Alert.alert(
        'Burn NFT',
        `Are you sure you want to burn "${detailSheet.nft.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Burn',
            style: 'destructive',
            onPress: () => {
              Alert.alert('Burn NFT', 'Burn functionality coming soon!');
            },
          },
        ]
      );
    }
  }, [detailSheet.nft]);

  // Get ordered section keys to display
  const visibleSectionKeys = useMemo<NftSectionKey[]>(() => {
    const mainnetKeys: NftSectionKey[] = ['solana', 'ethereum', 'bitcoin'];
    const testnetKeys: NftSectionKey[] = ['solana-devnet', 'ethereum-sepolia'];

    if (developerNetworks) {
      // Interleave: mainnet then testnet for each blockchain
      return ['solana', 'solana-devnet', 'ethereum', 'ethereum-sepolia', 'bitcoin'];
    }

    return mainnetKeys;
  }, [developerNetworks]);

  // Check if all mainnet sections are loading
  const isLoading =
    nftsBySections.solana.loading &&
    nftsBySections.ethereum.loading &&
    nftsBySections.bitcoin.loading;

  // Check if all visible sections are empty (after loading)
  const isEmpty = useMemo(() => {
    if (isLoading) return false;
    return visibleSectionKeys.every(
      (key) => nftsBySections[key].nfts.length === 0
    );
  }, [isLoading, visibleSectionKeys, nftsBySections]);

  // Get NFTs for current see all sheet
  const seeAllNfts = useMemo(() => {
    if (!seeAllSheet.sectionKey) return [];
    return nftsBySections[seeAllSheet.sectionKey].nfts;
  }, [seeAllSheet.sectionKey, nftsBySections]);

  // Get title and blockchain for see all sheet
  const seeAllInfo = useMemo(() => {
    if (!seeAllSheet.sectionKey) {
      return { title: 'NFTs', blockchain: 'solana' as NftBlockchain };
    }
    const section = nftsBySections[seeAllSheet.sectionKey];
    return {
      title: getSectionTitle(seeAllSheet.sectionKey, section),
      blockchain: section.blockchain,
    };
  }, [seeAllSheet.sectionKey, nftsBySections]);

  // Loading state - wait for account to be ready
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerOffset + vs(8) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text.primary}
            colors={['#FF6B35']}
          />
        }
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>My Collectibles</Text>

        {/* Developer Mode Banner */}
        {developerNetworks && (
          <View style={styles.devModeBanner}>
            <Text style={styles.devModeBannerText}>
              Developer Mode - Showing testnet NFTs
            </Text>
          </View>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <>
            <NftCarouselSectionSkeleton blockchain="solana" />
            <NftCarouselSectionSkeleton blockchain="ethereum" />
            <NftCarouselSectionSkeleton blockchain="bitcoin" />
          </>
        )}

        {/* Empty State */}
        {isEmpty && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Collectibles</Text>
            <Text style={styles.emptySubtext}>
              Your NFTs and Ordinals will appear here once you receive some
            </Text>
          </View>
        )}

        {/* Render visible sections */}
        {visibleSectionKeys.map((sectionKey) => {
          const section = nftsBySections[sectionKey];

          // Skip if loading or empty
          if (section.loading || section.nfts.length === 0) {
            return null;
          }

          const title = getSectionTitle(sectionKey, section);
          const subAccounts = sectionSubAccounts[sectionKey] ?? [];

          return (
            <NftCarouselSection
              key={sectionKey}
              title={title}
              blockchain={section.blockchain}
              nfts={section.nfts}
              onNftPress={(nft) => handleNftPress(nft, sectionKey)}
              onSeeAllPress={() => handleSeeAllPress(sectionKey)}
              renderBeforeCarousel={
                <SubAccountSelector
                  accounts={subAccounts}
                  activeIndex={sectionIndexes[sectionKey]}
                  onSelect={(index) => handleSectionIndexChange(sectionKey, index)}
                  style={styles.sectionSelector}
                />
              }
            />
          );
        })}
      </ScrollView>

      {/* NFT Detail Sheet */}
      <NftDetailSheet
        visible={detailSheet.visible}
        onClose={handleDetailSheetClose}
        nft={detailSheet.nft}
        onSendPress={handleSend}
        onBurnPress={handleBurn}
      />

      {/* See All Sheet */}
      {seeAllSheet.sectionKey && (
        <NftSeeAllSheet
          visible={seeAllSheet.visible}
          onClose={handleSeeAllSheetClose}
          title={seeAllInfo.title}
          blockchain={seeAllInfo.blockchain}
          nfts={seeAllNfts}
          onNftPress={(nft) => {
            // Close see all sheet and open detail sheet
            const currentSectionKey = seeAllSheet.sectionKey;
            handleSeeAllSheetClose();
            setTimeout(() => {
              if (currentSectionKey) {
                handleNftPress(nft, currentSectionKey);
              }
            }, 350);
          }}
        />
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: ms(16),
    marginTop: vs(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vs(componentSizes.tabBarScrollPadding),
  },
  pageTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(19.44),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.19,
    marginBottom: vs(24),
  },
  devModeBanner: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.5)',
    borderRadius: ms(8),
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    marginHorizontal: s(18),
    marginBottom: vs(16),
  },
  devModeBannerText: {
    fontFamily: 'DMSans-Medium',
    fontSize: ms(12),
    color: '#FF6B35',
    textAlign: 'center',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(48),
    paddingHorizontal: s(24),
    marginTop: vs(40),
  },
  emptyText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: vs(8),
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: ms(14),
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  sectionSelector: {
    marginBottom: vs(8),
  },
});
