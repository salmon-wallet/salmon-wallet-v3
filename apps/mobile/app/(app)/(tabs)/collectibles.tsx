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

import {
  SECTION_TO_NETWORK as SHARED_SECTION_TO_NETWORK,
  SOLANA_NETWORKS,
  SolanaAccount,
  canonicalNftToSolanaNftData,
    borderRadius,
    colors,
    componentSizes,
    createBurnTransaction,
    fontFamilyNative,
    fontSize,
    letterSpacing,
    spacing,
  // getEthereumNfts,
  // getBitcoinOrdinals,
  // ethereumNftToNftData,
  // bitcoinOrdinalToNftData,
  filterSpamNfts,
  getAllNfts,
  getNftSectionTitle,
  getShortAddress,
  getSolanaNfts,
  ms,
  s,
  useAccountsContext,
  useUserConfig,
  vs,
  // type EthereumNft,
  // type BitcoinOrdinal,
  type BlockchainAccount,
  type Nft,
  type SolanaNetworkId,
} from '@salmon/shared';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NftCard,
  NftCardSkeleton,
  // NftCarouselSection,
  // NftCarouselSectionSkeleton,
  // NftSeeAllSheet,
  NftDetailSheet,
  NftSendSheet,
  SolanaSvgIcon,
  SubAccountSelector,
  type NftBlockchain,
  type NftData,
  type NftDetailData,
  type SubAccount,
} from '../../../src/components';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended blockchain key that includes network suffix for devnet/testnet
 */
type NftSectionKey =
  | 'solana'
  | 'solana-devnet';
// | 'ethereum'
// | 'ethereum-sepolia'
// | 'bitcoin';

interface NftSection {
  nfts: NftData[];
  raw: Nft[]; // was: Nft[] | EthereumNft[] | BitcoinOrdinal[]
  loading: boolean;
  blockchain: NftBlockchain;
  networkLabel?: string; // e.g., "Devnet", "Sepolia"
  isTestnet: boolean;
}

type NftsBySection = Record<NftSectionKey, NftSection>;

// interface SeeAllSheetState {
//   visible: boolean;
//   sectionKey: NftSectionKey | null;
// }

// ============================================================================
// Constants
// ============================================================================

const SECTION_TO_NETWORK = SHARED_SECTION_TO_NETWORK;

const INITIAL_SECTION_INDEXES: Record<NftSectionKey, number> = {
  'solana': 0,
  'solana-devnet': 0,
  // 'ethereum': 0,
  // 'ethereum-sepolia': 0,
  // 'bitcoin': 0,
};

const INITIAL_SECTIONS: NftsBySection = {
  solana: { nfts: [], raw: [], loading: true, blockchain: 'solana', isTestnet: false },
  'solana-devnet': { nfts: [], raw: [], loading: false, blockchain: 'solana', networkLabel: 'Devnet', isTestnet: true },
  // ethereum: { nfts: [], raw: [], loading: true, blockchain: 'ethereum', isTestnet: false },
  // 'ethereum-sepolia': { nfts: [], raw: [], loading: false, blockchain: 'ethereum', networkLabel: 'Sepolia', isTestnet: true },
  // bitcoin: { nfts: [], raw: [], loading: true, blockchain: 'bitcoin', isTestnet: false },
};

// Grid layout constants (matching NftSeeAllSheet pattern)
const GRID_GAP = s(18);
const GRID_HORIZONTAL_PADDING = s(18);

// ============================================================================
// Helper Functions
// ============================================================================

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
  // const [seeAllSheet, setSeeAllSheet] = useState<SeeAllSheetState>({
  //   visible: false,
  //   sectionKey: null,
  // });
  const [detailSheet, setDetailSheet] = useState<{
    visible: boolean;
    nft: NftDetailData | null;
    sectionKey: NftSectionKey | null;
  }>({
    visible: false,
    nft: null,
    sectionKey: null,
  });
  const [sendSheetVisible, setSendSheetVisible] = useState(false);

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

  // Get the blockchain account for the NFT currently shown in the detail sheet
  const nftAccount: BlockchainAccount | undefined = useMemo(() => {
    if (!activeAccount || !detailSheet.sectionKey) return undefined;
    const networkId = SECTION_TO_NETWORK[detailSheet.sectionKey];
    const idx = sectionIndexes[detailSheet.sectionKey] ?? 0;
    return activeAccount.networksAccounts?.[networkId]?.[idx] ?? undefined;
  }, [activeAccount, detailSheet.sectionKey, sectionIndexes]);

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

      // const ethAccount = activeAccount.networksAccounts?.['ethereum-mainnet']?.[sectionIndexes['ethereum']];
      // const ethAddress = ethAccount?.getReceiveAddress() ?? '';

      // const btcAccount = activeAccount.networksAccounts?.['bitcoin-mainnet']?.[sectionIndexes['bitcoin']];
      // const btcAddress = btcAccount?.getReceiveAddress() ?? '';

      // Set loading state for Solana sections
      if (!isRefresh) {
        setNftsBySections((prev) => ({
          ...prev,
          solana: { ...prev.solana, loading: true },
          // ethereum: { ...prev.ethereum, loading: true },
          // bitcoin: { ...prev.bitcoin, loading: true },
          // Also set loading for testnet sections if developer mode is enabled
          ...(developerNetworks && {
            'solana-devnet': { ...prev['solana-devnet'], loading: true },
            // 'ethereum-sepolia': { ...prev['ethereum-sepolia'], loading: true },
          }),
        }));
      }

      // Build fetch promises - Solana only
      const fetchPromises: Promise<{ key: NftSectionKey; result: Nft[] }>[] = [
        // Mainnet fetches (always, if address available)
        (solanaAddress
          ? getAllNfts(SOLANA_NETWORKS['solana-mainnet'], solanaAddress, false, getSolanaNfts)
          : Promise.resolve([]))
          .then((result) => ({ key: 'solana' as NftSectionKey, result }))
          .catch(() => ({ key: 'solana' as NftSectionKey, result: [] as Nft[] })),

        // (ethAddress ? getEthereumNfts('ethereum-mainnet', ethAddress) : Promise.resolve([]))
        //   .then((result) => ({ key: 'ethereum' as NftSectionKey, result }))
        //   .catch(() => ({ key: 'ethereum' as NftSectionKey, result: [] })),

        // (btcAddress ? getBitcoinOrdinals('bitcoin-mainnet', btcAddress) : Promise.resolve([]))
        //   .then((result) => ({ key: 'bitcoin' as NftSectionKey, result }))
        //   .catch(() => ({ key: 'bitcoin' as NftSectionKey, result: [] })),
      ];

      // Add testnet fetches if developer mode is enabled (Solana devnet only)
      if (developerNetworks) {
        fetchPromises.push(
          // Solana Devnet
          (solanaDevnetAddress
            ? getAllNfts(SOLANA_NETWORKS['solana-devnet'], solanaDevnetAddress, false, getSolanaNfts)
            : Promise.resolve([]))
            .then((result) => ({ key: 'solana-devnet' as NftSectionKey, result }))
            .catch(() => ({ key: 'solana-devnet' as NftSectionKey, result: [] as Nft[] })),

          // // Ethereum Sepolia (uses its own section index)
          // (() => {
          //   const sepoliaAccount = activeAccount.networksAccounts?.['ethereum-sepolia']?.[sectionIndexes['ethereum-sepolia']];
          //   const sepoliaAddress = sepoliaAccount?.getReceiveAddress() ?? ethAddress;
          //   return sepoliaAddress ? getEthereumNfts('ethereum-sepolia', sepoliaAddress) : Promise.resolve([]);
          // })()
          //   .then((result) => ({ key: 'ethereum-sepolia' as NftSectionKey, result }))
          //   .catch(() => ({ key: 'ethereum-sepolia' as NftSectionKey, result: [] })),
        );
      }

      // Fetch all in parallel
      const results = await Promise.all(fetchPromises);

      // Process results
      const newSections = { ...INITIAL_SECTIONS };

      for (const { key, result } of results) {
        const section = newSections[key];
        const applyFilter = !developerNetworks;

        if (key === 'solana' || key === 'solana-devnet') {
          const solanaNfts = result as Nft[];
          const mapped = solanaNfts.map(canonicalNftToSolanaNftData);
          newSections[key] = {
            ...section,
            nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
            raw: solanaNfts,
            loading: false,
          };
        }
        // } else if (key === 'ethereum' || key === 'ethereum-sepolia') {
        //   const ethNfts = result as EthereumNft[];
        //   const mapped = ethNfts.map(ethereumNftToNftData);
        //   newSections[key] = {
        //     ...section,
        //     nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
        //     raw: ethNfts,
        //     loading: false,
        //   };
        // } else if (key === 'bitcoin') {
        //   const btcNfts = result as BitcoinOrdinal[];
        //   const mapped = btcNfts.map(bitcoinOrdinalToNftData);
        //   newSections[key] = {
        //     ...section,
        //     nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
        //     raw: btcNfts,
        //     loading: false,
        //   };
        // }
      }

      // If developer mode is off, ensure testnet sections are empty and not loading
      if (!developerNetworks) {
        newSections['solana-devnet'] = { ...INITIAL_SECTIONS['solana-devnet'], loading: false };
        // newSections['ethereum-sepolia'] = { ...INITIAL_SECTIONS['ethereum-sepolia'], loading: false };
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
  }, [ready, activeAccount, activeBlockchainAccount, developerNetworks, fetchAllNfts]);

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
      }
      // } else if (section.blockchain === 'ethereum') {
      //   const rawNft = (section.raw as EthereumNft[]).find(
      //     (n) => `${n.contract}:${n.mint}` === nftData.mint
      //   );
      //   if (rawNft) {
      //     detailData = ethereumNftToNftData(rawNft);
      //   }
      // } else if (section.blockchain === 'bitcoin') {
      //   const rawNft = (section.raw as BitcoinOrdinal[]).find(
      //     (n) => n.inscriptionId === nftData.mint
      //   );
      //   if (rawNft) {
      //     detailData = bitcoinOrdinalToNftData(rawNft);
      //   }
      // }

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

  // // Handle "See All" press - open full grid sheet
  // const handleSeeAllPress = useCallback((sectionKey: NftSectionKey) => {
  //   setSeeAllSheet({
  //     visible: true,
  //     sectionKey,
  //   });
  // }, []);

  // Handle detail sheet close
  const handleDetailSheetClose = useCallback(() => {
    setDetailSheet((prev) => ({ ...prev, visible: false }));
    // Clear NFT data after animation
    setTimeout(() => {
      setDetailSheet({ visible: false, nft: null, sectionKey: null });
    }, 300);
  }, []);

  // // Handle see all sheet close
  // const handleSeeAllSheetClose = useCallback(() => {
  //   setSeeAllSheet({ visible: false, sectionKey: null });
  // }, []);

  // Handle Send button — close detail sheet, open send sheet
  const handleSend = useCallback(() => {
    if (detailSheet.nft) {
      handleDetailSheetClose();
      setTimeout(() => setSendSheetVisible(true), 350);
    }
  }, [detailSheet.nft, handleDetailSheetClose]);

  const handleSendSuccess = useCallback((txId: string) => {
    setSendSheetVisible(false);
    Alert.alert('NFT Sent', `Transaction submitted successfully.\n\nTx: ${txId.slice(0, 20)}...`, [{ text: 'OK' }]);
    // Refresh NFT list
    fetchAllNfts(true);
  }, [fetchAllNfts]);

  // Handle Burn button — confirm and execute burn (Solana only)
  const handleBurn = useCallback(() => {
    if (!detailSheet.nft) return;
    const nft = detailSheet.nft;
    const blockchain = nft.blockchain;

    if (blockchain !== 'solana') {
      Alert.alert('Not Supported', `Burning ${blockchain} NFTs is not yet supported.`);
      return;
    }

    Alert.alert(
      'Burn NFT',
      `Are you sure you want to burn "${nft.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Burn',
          style: 'destructive',
          onPress: async () => {
            if (!nftAccount) {
              Alert.alert('Error', 'No account available for this network.');
              return;
            }
            try {
              const ownerAddress = nftAccount.getReceiveAddress();
              const sectionKey = detailSheet.sectionKey;
              const networkId = sectionKey ? SECTION_TO_NETWORK[sectionKey] : 'solana-mainnet';
              const txResponse = await createBurnTransaction(
                { mintAddress: nft.mint, ownerAddress },
                networkId as SolanaNetworkId,
              );
              // Sign and send using the account's signAndSend helper
              const solAccount = nftAccount as SolanaAccount;
              const connection = await solAccount.getConnection();
              // Deserialize, sign, and send the transaction
              const { VersionedTransaction } = require('@solana/web3.js');
              const txBuffer = Buffer.from(txResponse.transaction, 'base64');
              const transaction = VersionedTransaction.deserialize(txBuffer);
              transaction.sign([solAccount.keyPair]);
              const signature = await connection.sendRawTransaction(transaction.serialize());
              handleDetailSheetClose();
              Alert.alert('NFT Burned', `"${nft.name}" has been burned.\n\nTx: ${String(signature).slice(0, 20)}...`);
              fetchAllNfts(true);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Burn failed';
              Alert.alert('Burn Failed', msg);
            }
          },
        },
      ]
    );
  }, [detailSheet.nft, detailSheet.sectionKey, nftAccount, handleDetailSheetClose, fetchAllNfts]);

  // Get ordered section keys to display (Solana only)
  const visibleSectionKeys = useMemo<NftSectionKey[]>(() => {
    // const mainnetKeys: NftSectionKey[] = ['solana', 'ethereum', 'bitcoin'];
    // const testnetKeys: NftSectionKey[] = ['solana-devnet', 'ethereum-sepolia'];
    if (developerNetworks) {
      return ['solana', 'solana-devnet'];
      // was: ['solana', 'solana-devnet', 'ethereum', 'ethereum-sepolia', 'bitcoin'];
    }
    return ['solana'];
    // was: mainnetKeys;
  }, [developerNetworks]);

  // Check if Solana section is loading
  const isLoading = nftsBySections.solana.loading;
  // was: nftsBySections.solana.loading && nftsBySections.ethereum.loading && nftsBySections.bitcoin.loading;

  // Check if all visible sections are empty (after loading)
  const isEmpty = useMemo(() => {
    if (isLoading) return false;
    return visibleSectionKeys.every(
      (key) => nftsBySections[key].nfts.length === 0
    );
  }, [isLoading, visibleSectionKeys, nftsBySections]);

  // // Get NFTs for current see all sheet
  // const seeAllNfts = useMemo(() => {
  //   if (!seeAllSheet.sectionKey) return [];
  //   return nftsBySections[seeAllSheet.sectionKey].nfts;
  // }, [seeAllSheet.sectionKey, nftsBySections]);

  // // Get title and blockchain for see all sheet
  // const seeAllInfo = useMemo(() => {
  //   if (!seeAllSheet.sectionKey) {
  //     return { title: 'NFTs', blockchain: 'solana' as NftBlockchain };
  //   }
  //   const section = nftsBySections[seeAllSheet.sectionKey];
  //   return {
  //     title: getNftSectionTitle(seeAllSheet.sectionKey, section),
  //     blockchain: section.blockchain,
  //   };
  // }, [seeAllSheet.sectionKey, nftsBySections]);

  // Loading state - wait for account to be ready
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
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
            colors={[colors.accent.primary]}
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

        {/* Empty State */}
        {isEmpty && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Collectibles</Text>
            <Text style={styles.emptySubtext}>
              Your NFTs and Ordinals will appear here once you receive some
            </Text>
          </View>
        )}

        {/* Render visible sections — Solana only, grid layout */}
        {visibleSectionKeys.map((sectionKey) => {
          const section = nftsBySections[sectionKey];

          // Skip if not loading and empty
          if (!section.loading && section.nfts.length === 0) {
            return null;
          }

          const title = getNftSectionTitle(sectionKey, section);
          const subAccounts = sectionSubAccounts[sectionKey] ?? [];

          return (
            <View key={sectionKey} style={styles.sectionContainer}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <SolanaSvgIcon size={ms(24)} color={colors.text.primary} />
                <Text style={styles.sectionHeaderTitle}>{title}</Text>
                <Text style={styles.sectionHeaderCount}>({section.nfts.length})</Text>
              </View>

              {/* Sub-account selector */}
              <SubAccountSelector
                accounts={subAccounts}
                activeIndex={sectionIndexes[sectionKey]}
                onSelect={(index) => handleSectionIndexChange(sectionKey, index)}
                style={styles.sectionSelector}
              />

              {/* Grid or Skeleton */}
              {section.loading ? (
                <View style={styles.gridContainer}>
                  <View style={styles.gridRow}>
                    <NftCardSkeleton style={styles.gridCard} />
                    <NftCardSkeleton style={styles.gridCard} />
                  </View>
                  <View style={styles.gridRow}>
                    <NftCardSkeleton style={styles.gridCard} />
                    <NftCardSkeleton style={styles.gridCard} />
                  </View>
                  <View style={styles.gridRow}>
                    <NftCardSkeleton style={styles.gridCard} />
                    <NftCardSkeleton style={styles.gridCard} />
                  </View>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {section.nfts.reduce<NftData[][]>((rows, nft, i) => {
                    if (i % 2 === 0) rows.push([nft]);
                    else rows[rows.length - 1].push(nft);
                    return rows;
                  }, []).map((pair, rowIndex) => (
                    <View key={rowIndex} style={styles.gridRow}>
                      {pair.map((nft) => (
                        <NftCard
                          key={nft.mint}
                          nft={nft}
                          onPress={() => handleNftPress(nft, sectionKey)}
                          style={styles.gridCard}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Original carousel rendering (commented out):
        {visibleSectionKeys.map((sectionKey) => {
          const section = nftsBySections[sectionKey];
          if (section.loading || section.nfts.length === 0) return null;
          const title = getNftSectionTitle(sectionKey, section);
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
        */}
      </ScrollView>

      {/* NFT Detail Sheet */}
      <NftDetailSheet
        visible={detailSheet.visible}
        onClose={handleDetailSheetClose}
        nft={detailSheet.nft}
        onSendPress={handleSend}
        onBurnPress={handleBurn}
      />

      {/* See All Sheet (commented out — grid replaces it)
      {seeAllSheet.sectionKey && (
        <NftSeeAllSheet
          visible={seeAllSheet.visible}
          onClose={handleSeeAllSheetClose}
          title={seeAllInfo.title}
          blockchain={seeAllInfo.blockchain}
          nfts={seeAllNfts}
          onNftPress={(nft) => {
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
      */}

      {/* NFT Send Sheet */}
      <NftSendSheet
        visible={sendSheetVisible}
        onClose={() => setSendSheetVisible(false)}
        nft={detailSheet.nft}
        account={nftAccount}
        onSuccess={handleSendSuccess}
      />
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
    color: colors.text.muted,
    fontSize: ms(fontSize.md),
    marginTop: vs(spacing.lg),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vs(componentSizes.tabBarScrollPadding),
  },
  pageTitle: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.xl),
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: letterSpacing.wide,
    marginBottom: vs(spacing['2xl']),
  },
  devModeBanner: {
    backgroundColor: colors.accent.tint,
    borderWidth: 1,
    borderColor: colors.accent.border,
    borderRadius: ms(borderRadius.md),
    paddingVertical: vs(spacing.sm),
    paddingHorizontal: s(spacing.md),
    marginHorizontal: s(spacing.headerPadding),
    marginBottom: vs(spacing.lg),
  },
  devModeBannerText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.sm),
    color: colors.accent.primary,
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
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(fontSize.lg),
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: vs(spacing.sm),
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.base),
    color: colors.text.disabled,
    textAlign: 'center',
  },
  sectionSelector: {
    marginBottom: vs(8),
  },
  // Grid layout styles (matching NftSeeAllSheet pattern)
  sectionContainer: {
    marginBottom: vs(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(18),
    marginBottom: vs(8),
  },
  sectionHeaderTitle: {
    fontFamily: fontFamilyNative.semiBold,
    fontSize: ms(16),
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  sectionHeaderCount: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(13),
    color: colors.text.secondary,
  },
  gridContainer: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  gridCard: {
    flex: 1,
    maxWidth: `${(100 - 2) / 2}%`,
  },
});
