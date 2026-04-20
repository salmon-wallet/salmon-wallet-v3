/**
 * CollectiblesPage - Multi-chain NFT collection display
 *
 * Fetches and displays NFTs across ALL blockchains in Netflix-style
 * carousel sections (matching mobile's multi-chain approach).
 * Each section has horizontal scrolling with arrow navigation.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  fontFamily,
  componentSizes,
  SOLANA_NETWORKS,
  // getEthereumNfts,
  // getBitcoinOrdinals,
  canonicalNftToSolanaNftData,
  // ethereumNftToNftData,
  // bitcoinOrdinalToNftData,
  filterSpamNfts,
  getNftSectionTitle,
  // getVisibleNftSectionKeys,
  INITIAL_NFT_SECTIONS,
  type Account,
  type NftData,
  type NftSectionKey,
  type NftsBySection,
  type Nft,
  // type EthereumNft,
  // type BitcoinOrdinal,
  getSolanaNfts,
} from '@salmon/shared';
import { getAll as getAllNfts } from '@salmon/shared/blockchain/solana/nft';
import {
  // NftCarouselSection,
  // NftCarouselSectionSkeleton,
  NftCard,
  NftCardSkeleton,
  SolanaSvgIcon,
} from '@/components';

// ============================================================================
// Props
// ============================================================================

interface CollectiblesPageProps {
  activeAccount: Account | undefined;
  developerNetworks: boolean;
  refreshKey?: number;
  /** Callback when an NFT is pressed — navigates to detail page */
  onNftDetailPress?: (nft: NftData) => void;
  // /** Callback when "See All" is pressed — navigates to see-all page */
  // onSeeAllPress?: (title: string, blockchain: string, nfts: NftData[]) => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  paddingTop: spacing.md,
  paddingBottom: spacing.lg,
  overflowY: 'auto',
  gap: spacing.lg,
});

const SectionTitle = styled(Typography)({
  fontSize: fontSize.lg,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: fontFamily.sans,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const EmptyState = styled(Box)({
  padding: `${spacing.xl}px ${spacing.lg}px`,
  textAlign: 'center',
  backgroundColor: colors.background.card,
  borderRadius: borderRadius.lg,
  marginLeft: spacing.lg,
  marginRight: spacing.lg,
});

const EmptyStateText = styled(Typography)({
  fontSize: fontSize.base,
  fontWeight: 500,
  color: colors.text.secondary,
  fontFamily: fontFamily.sans,
  marginBottom: spacing.sm,
});

const EmptyStateSubtext = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.disabled,
  fontFamily: fontFamily.sans,
});

const SectionHeaderRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const SectionTitleText = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: fontFamily.sans,
  flex: 1,
});

const SectionCount = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.secondary,
  fontFamily: fontFamily.sans,
});

const Grid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md,
  justifyItems: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const SkeletonGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md,
  justifyItems: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

// ============================================================================
// Component
// ============================================================================

export function CollectiblesPage({
  activeAccount,
  developerNetworks,
  refreshKey = 0,
  onNftDetailPress,
  /* , onSeeAllPress */
}: CollectiblesPageProps) {
  const { t } = useTranslation();
  const [nftsBySections, setNftsBySections] = useState<NftsBySection>(INITIAL_NFT_SECTIONS);

  // Fetch all NFTs in parallel (mirroring mobile pattern)
  useEffect(() => {
    if (!activeAccount) return;

    const fetchAllNfts = async () => {
      // Reset loading state
      setNftsBySections((prev) => ({
        ...prev,
        solana: { ...prev.solana, loading: true },
        // ethereum: { ...prev.ethereum, loading: true },
        // bitcoin: { ...prev.bitcoin, loading: true },
        ...(developerNetworks && {
          'solana-devnet': { ...prev['solana-devnet'], loading: true },
          // 'ethereum-sepolia': { ...prev['ethereum-sepolia'], loading: true },
        }),
      }));

      // Extract addresses from networksAccounts
      const solanaAccount = activeAccount.networksAccounts?.['solana-mainnet']?.[0];
      const solanaAddress = solanaAccount?.getReceiveAddress() ?? '';

      // const ethAccount = activeAccount.networksAccounts?.['ethereum-mainnet']?.[0];
      // const ethAddress = ethAccount?.getReceiveAddress() ?? '';

      // const btcAccount = activeAccount.networksAccounts?.['bitcoin-mainnet']?.[0];
      // const btcAddress = btcAccount?.getReceiveAddress() ?? '';

      // Build fetch promises - only Solana
      const fetchPromises: Promise<{ key: NftSectionKey; result: Nft[] }>[] = [
        (solanaAddress
          ? getAllNfts(SOLANA_NETWORKS['solana-mainnet'], solanaAddress, refreshKey > 0, getSolanaNfts)
          : Promise.resolve([]))
          .then((result) => ({ key: 'solana' as NftSectionKey, result }))
          .catch(() => ({ key: 'solana' as NftSectionKey, result: [] as Nft[] })),

        // (ethAddress ? getEthereumNfts('ethereum-mainnet', ethAddress) : Promise.resolve([]))
        //   .then((result) => ({ key: 'ethereum' as NftSectionKey, result }))
        //   .catch(() => ({ key: 'ethereum' as NftSectionKey, result: [] as EthereumNft[] })),

        // (btcAddress ? getBitcoinOrdinals('bitcoin-mainnet', btcAddress) : Promise.resolve([]))
        //   .then((result) => ({ key: 'bitcoin' as NftSectionKey, result }))
        //   .catch(() => ({ key: 'bitcoin' as NftSectionKey, result: [] as BitcoinOrdinal[] })),
      ];

      // Add testnet fetches if developer mode is enabled (Solana devnet only)
      if (developerNetworks) {
        const solanaDevnetAccount = activeAccount.networksAccounts?.['solana-devnet']?.[0];
        const solanaDevnetAddress = solanaDevnetAccount?.getReceiveAddress() ?? '';

        // const sepoliaAccount = activeAccount.networksAccounts?.['ethereum-sepolia']?.[0];
        // const sepoliaAddress = sepoliaAccount?.getReceiveAddress() ?? '';

        fetchPromises.push(
          (solanaDevnetAddress
            ? getAllNfts(SOLANA_NETWORKS['solana-devnet'], solanaDevnetAddress, refreshKey > 0, getSolanaNfts)
            : Promise.resolve([]))
            .then((result) => ({ key: 'solana-devnet' as NftSectionKey, result }))
            .catch(() => ({ key: 'solana-devnet' as NftSectionKey, result: [] as Nft[] })),

          // (sepoliaAddress ? getEthereumNfts('ethereum-sepolia', sepoliaAddress) : Promise.resolve([]))
          //   .then((result) => ({ key: 'ethereum-sepolia' as NftSectionKey, result }))
          //   .catch(() => ({ key: 'ethereum-sepolia' as NftSectionKey, result: [] as EthereumNft[] })),
        );
      }

      // Fetch all in parallel
      const results = await Promise.all(fetchPromises);

      // Process results
      const newSections = { ...INITIAL_NFT_SECTIONS };

      for (const { key, result } of results) {
        const section = newSections[key];
        const applyFilter = !developerNetworks;

        if (key === 'solana' || key === 'solana-devnet') {
          const mapped = (result as Nft[]).map(canonicalNftToSolanaNftData);
          newSections[key] = {
            ...section,
            nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
            loading: false,
          };
        }
        // } else if (key === 'ethereum' || key === 'ethereum-sepolia') {
        //   const mapped = (result as EthereumNft[]).map(ethereumNftToNftData);
        //   newSections[key] = {
        //     ...section,
        //     nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
        //     loading: false,
        //   };
        // } else if (key === 'bitcoin') {
        //   const mapped = (result as BitcoinOrdinal[]).map(bitcoinOrdinalToNftData);
        //   newSections[key] = {
        //     ...section,
        //     nfts: applyFilter ? filterSpamNfts(mapped) : mapped,
        //     loading: false,
        //   };
        // }
      }

      // If developer mode is off, ensure testnet sections are empty and not loading
      if (!developerNetworks) {
        newSections['solana-devnet'] = { ...INITIAL_NFT_SECTIONS['solana-devnet'], loading: false };
        // newSections['ethereum-sepolia'] = { ...INITIAL_NFT_SECTIONS['ethereum-sepolia'], loading: false };
      }

      setNftsBySections(newSections);
    };

    fetchAllNfts();
  }, [activeAccount, developerNetworks, refreshKey]);

  // Derived state (Solana only)
  // const visibleKeys = useMemo(
  //   () => getVisibleNftSectionKeys(developerNetworks),
  //   [developerNetworks],
  // );
  const visibleKeys = useMemo<NftSectionKey[]>(
    () => developerNetworks ? ['solana', 'solana-devnet'] : ['solana'],
    [developerNetworks],
  );

  const isLoading = visibleKeys.some((key) => nftsBySections[key].loading);

  const isEmpty = !isLoading && visibleKeys.every((key) => nftsBySections[key].nfts.length === 0);

  // Handlers
  const handleNftPress = useCallback((nft: NftData) => {
    onNftDetailPress?.(nft);
  }, [onNftDetailPress]);

  // const handleSeeAllPress = useCallback((sectionKey: NftSectionKey) => {
  //   const section = nftsBySections[sectionKey];
  //   const title = getNftSectionTitle(sectionKey, section);
  //   onSeeAllPress?.(title, section.blockchain, section.nfts);
  // }, [nftsBySections, onSeeAllPress]);

  return (
    <Container>
      <SectionTitle>{t('collectibles.title', 'Collectibles')}</SectionTitle>

      {/* Empty state */}
      {isEmpty && (
        <EmptyState>
          <EmptyStateText>
            {t('collectibles.empty', 'No collectibles found')}
          </EmptyStateText>
          <EmptyStateSubtext>
            {t('collectibles.empty_hint', 'Your NFTs and collectibles will appear here')}
          </EmptyStateSubtext>
        </EmptyState>
      )}

      {/* NFT sections — Solana only, grid layout */}
      {visibleKeys.map((key) => {
        const section = nftsBySections[key];
        if (section.nfts.length === 0 && !section.loading) return null;
        return (
          <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: `${spacing.md}px` }}>
            {/* Section header */}
            <SectionHeaderRow>
              <SolanaSvgIcon sx={{ width: componentSizes.iconSizeMedium, height: componentSizes.iconSizeMedium, color: colors.text.primary }} />
              <SectionTitleText>{getNftSectionTitle(key, section)}</SectionTitleText>
              <SectionCount>({section.nfts.length})</SectionCount>
            </SectionHeaderRow>

            {/* Grid or Skeleton */}
            {section.loading ? (
              <SkeletonGrid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <NftCardSkeleton key={i} />
                ))}
              </SkeletonGrid>
            ) : (
              <Grid>
                {section.nfts.map((nft, index) => (
                  <NftCard
                    key={`${nft.mint}-${index}`}
                    nft={nft}
                    onPress={handleNftPress ? () => handleNftPress(nft) : undefined}
                  />
                ))}
              </Grid>
            )}
          </Box>
        );
      })}

      {/* Original carousel rendering (commented out):
      {visibleKeys.map((key) => {
        const section = nftsBySections[key];
        if (section.nfts.length === 0 && !section.loading) return null;
        return (
          <NftCarouselSection
            key={key}
            title={getNftSectionTitle(key, section)}
            blockchain={section.blockchain}
            nfts={section.nfts}
            loading={section.loading}
            onNftPress={handleNftPress}
            onSeeAllPress={() => handleSeeAllPress(key)}
          />
        );
      })}
      */}

    </Container>
  );
}
