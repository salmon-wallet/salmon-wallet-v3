import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  canonicalNftToSolanaNftData,
  filterSpamNfts,
  getNftSectionTitle,
  INITIAL_NFT_SECTIONS,
  type Account,
  type NftData,
  type NftSectionKey,
  type NftSection,
  type NftsBySection,
  isSolanaAccount,
} from '@salmon/shared';
import { NftCarouselSection } from '@salmon/ui';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CollectiblesTabProps {
  activeAccount: Account | undefined;
  developerNetworks: boolean;
  onNftDetailPress?: (nft: NftData) => void;
  onSeeAllPress?: (data: { title: string; blockchain: string; nfts: NftData[] }) => void;
}

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const ScrollContainer = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: `${spacing.lg}px`,
});

const EmptyState = styled(Box)({
  padding: `${spacing['2xl']}px ${spacing.lg}px`,
  textAlign: 'center',
});

const EmptyStateText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
  fontFamily: fontFamily.sans,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CollectiblesTab({
  activeAccount,
  developerNetworks,
  onNftDetailPress,
  onSeeAllPress,
}: CollectiblesTabProps): React.ReactElement {
  const { t } = useTranslation();
  const [nftsBySections, setNftsBySections] = useState<NftsBySection>(INITIAL_NFT_SECTIONS);

  // Fetch NFTs when account changes
  useEffect(() => {
    if (!activeAccount?.networksAccounts) return;

    let cancelled = false;

    const fetchNfts = async () => {
      // Determine which sections to fetch
      const sectionKeys: NftSectionKey[] = ['solana'];
      if (developerNetworks && activeAccount.networksAccounts['solana-devnet']) {
        sectionKeys.push('solana-devnet');
      }

      // Set loading
      setNftsBySections((prev) => {
        const next = { ...prev };
        for (const key of sectionKeys) {
          next[key] = { ...next[key], loading: true };
        }
        return next;
      });

      // Fetch for each section
      for (const key of sectionKeys) {
        const networkId = key === 'solana' ? 'solana-mainnet' : 'solana-devnet';
        const accounts = activeAccount.networksAccounts[networkId];
        if (!accounts || accounts.length === 0) {
          if (!cancelled) {
            setNftsBySections((prev) => ({
              ...prev,
              [key]: { nfts: [], loading: false },
            }));
          }
          continue;
        }

        try {
          const account = accounts[0];
          if (!account) continue;

          if (!isSolanaAccount(account)) continue;
          const rawNfts = await account.getAllNfts();
          if (cancelled) return;

          const nftDataList: NftData[] = rawNfts
            .map((nft) => canonicalNftToSolanaNftData(nft));

          // Filter spam on mainnet only (not in dev mode)
          const filtered = key === 'solana' && !developerNetworks
            ? filterSpamNfts(nftDataList)
            : nftDataList;

          setNftsBySections((prev) => ({
            ...prev,
            [key]: { nfts: filtered, loading: false },
          }));
        } catch (error) {
          console.error(`Failed to fetch NFTs for ${key}:`, error);
          if (!cancelled) {
            setNftsBySections((prev) => ({
              ...prev,
              [key]: { nfts: [], loading: false },
            }));
          }
        }
      }
    };

    fetchNfts();
    return () => { cancelled = true; };
  }, [activeAccount, developerNetworks]);

  // Visible section keys
  const visibleKeys = useMemo(() => {
    const keys: NftSectionKey[] = ['solana'];
    if (developerNetworks) keys.push('solana-devnet');
    return keys;
  }, [developerNetworks]);

  const isLoading = visibleKeys.some((key) => nftsBySections[key].loading);
  const isEmpty = !isLoading && visibleKeys.every((key) => nftsBySections[key].nfts.length === 0);

  const handleNftPress = useCallback((nft: NftData) => {
    onNftDetailPress?.(nft);
  }, [onNftDetailPress]);

  const handleSeeAll = useCallback((_key: NftSectionKey, title: string, nfts: NftData[]) => {
    onSeeAllPress?.({ title, blockchain: 'solana', nfts });
  }, [onSeeAllPress]);

  return (
    <ScrollContainer>
      {isEmpty && (
        <EmptyState>
          <EmptyStateText>{t('collectibles.no_nfts', 'No collectibles found')}</EmptyStateText>
        </EmptyState>
      )}

      {visibleKeys.map((key) => {
        const section = nftsBySections[key];
        if (!section.loading && section.nfts.length === 0) return null;

        const title = getNftSectionTitle(key, section as NftSection);

        return (
          <NftCarouselSection
            key={key}
            title={title}
            blockchain="solana"
            nfts={section.nfts}
            loading={section.loading}
            onNftPress={handleNftPress}
            onSeeAllPress={() => handleSeeAll(key, title, section.nfts)}
          />
        );
      })}
    </ScrollContainer>
  );
}
