/**
 * CollectiblesPage - NFT collection display
 *
 * Fetches and displays NFTs across Solana, Ethereum, and Bitcoin networks.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  spacing,
  fontFamily,
  getSolanaNfts,
  getEthereumNfts,
  getBitcoinOrdinals,
  getAccountBlockchainType,
  solanaNftToNftData,
  ethereumNftToNftData,
  bitcoinOrdinalToNftData,
  type BlockchainAccount,
  type NftData,
  type SolanaNftFromHelius,
  type EthereumNetworkId,
  type BitcoinNetworkId,
} from '@salmon/shared';
import { NftCard, NftCardSkeleton, NftDetailSheet } from '@salmon/ui-extension';

interface CollectiblesPageProps {
  activeBlockchainAccount: BlockchainAccount | undefined;
  networkId: string | null;
}

const Container = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: `0 ${spacing.lg}px ${spacing.lg}px`,
});

const SectionTitle = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginBottom: spacing.md,
  marginTop: spacing.lg,
});

const Grid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md,
});

const EmptyState = styled(Box)({
  padding: `${spacing.xl}px ${spacing.lg}px`,
  textAlign: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 12,
});

const EmptyStateText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  marginBottom: spacing.sm,
});

const EmptyStateSubtext = styled(Typography)({
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.4)',
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

export function CollectiblesPage({ activeBlockchainAccount, networkId }: CollectiblesPageProps) {
  const { t } = useTranslation();
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<NftData | null>(null);

  useEffect(() => {
    const fetchNfts = async () => {
      if (!activeBlockchainAccount || !networkId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const allNfts: NftData[] = [];

      try {
        const blockchain = getAccountBlockchainType(activeBlockchainAccount);
        const address = activeBlockchainAccount.getReceiveAddress();

        if (blockchain === 'solana') {
          const solanaNfts = await getSolanaNfts(networkId, address, false);
          allNfts.push(...solanaNfts.map((n) => solanaNftToNftData(n as unknown as SolanaNftFromHelius)));
        } else if (blockchain === 'ethereum') {
          const ethNfts = await getEthereumNfts(networkId as EthereumNetworkId, address);
          allNfts.push(...ethNfts.map(ethereumNftToNftData));
        } else if (blockchain === 'bitcoin') {
          const ordinals = await getBitcoinOrdinals(networkId as BitcoinNetworkId, address);
          allNfts.push(...ordinals.map(bitcoinOrdinalToNftData));
        }
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
      }

      setNfts(allNfts);
      setLoading(false);
    };

    fetchNfts();
  }, [activeBlockchainAccount, networkId]);

  const handleNftPress = useCallback((nft: NftData) => {
    setSelectedNft(nft);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNft(null);
  }, []);

  if (loading) {
    return (
      <Container>
        <SectionTitle>{t('collectibles.title', 'Collectibles')}</SectionTitle>
        <Grid>
          <NftCardSkeleton />
          <NftCardSkeleton />
          <NftCardSkeleton />
          <NftCardSkeleton />
        </Grid>
      </Container>
    );
  }

  if (nfts.length === 0) {
    return (
      <Container>
        <SectionTitle>{t('collectibles.title', 'Collectibles')}</SectionTitle>
        <EmptyState>
          <EmptyStateText>
            {t('collectibles.empty', 'No collectibles found')}
          </EmptyStateText>
          <EmptyStateSubtext>
            {t('collectibles.empty_hint', 'Your NFTs and collectibles will appear here')}
          </EmptyStateSubtext>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <SectionTitle>{t('collectibles.title', 'Collectibles')}</SectionTitle>
      <Grid>
        {nfts.map((nft, index) => (
          <NftCard
            key={`${nft.mint}-${index}`}
            nft={nft}
            onPress={() => handleNftPress(nft)}
          />
        ))}
      </Grid>

      {selectedNft && (
        <NftDetailSheet
          visible={!!selectedNft}
          onClose={handleCloseDetail}
          nft={selectedNft}
        />
      )}
    </Container>
  );
}
