/**
 * NftDetailPage - Full-page NFT detail view
 *
 * Replaces the former NftDetailSheet dialog.
 * Renders as a full page with back navigation, matching the
 * page-navigation pattern used by TokenDetailPage.
 *
 * Content: NFT image, blockchain badge, description, attributes,
 * blockchain-specific details, and Send/Burn action buttons.
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CallMadeIcon from '@mui/icons-material/CallMade';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

import {
  colors,
  spacing,
  gradients,
  fontFamily,
  fontWeight,
  fontSize,
  isSolanaNft,
  isEthereumNft,
  isBitcoinNft,
  getNftBlockchainLabel,
  getSatRarityColor,
  getShortAddress,
} from '@salmon/shared';

import { BlurContainer } from '../BlurContainer';
import { PageShell } from '../PageShell';
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon';
import type { NftDetailPageProps, NftAttribute } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const ContentContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  paddingLeft: spacing.headerPadding,
  paddingRight: spacing.headerPadding,
  paddingTop: spacing.lg,
  paddingBottom: spacing['4xl'],
});

const ImageContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: spacing.sm,
});

const NftImage = styled('img')({
  width: '100%',
  maxWidth: 406,
  aspectRatio: '1 / 1',
  borderRadius: 18,
  objectFit: 'cover',
  boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.9)',
});

const SectionContent = styled(Box)({
  padding: 7,
  position: 'relative',
  zIndex: 1,
});

const SectionTitle = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.bold,
  color: colors.text.primary,
  marginBottom: spacing.sm,
});

const DescriptionText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  color: colors.text.secondary,
  lineHeight: 1.5,
});

const AttributesGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  marginLeft: -6,
  marginRight: -6,
});

const AttributeItem = styled(Box)({
  width: '50%',
  paddingLeft: 6,
  paddingRight: 6,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  boxSizing: 'border-box',
});

const AttributeName = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: 900,
  color: colors.text.primary,
  marginBottom: spacing.xs,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const AttributeValue = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.regular,
  color: colors.text.secondary,
});

const BlockchainBadgeContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
});

const BlockchainBadgeContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 6,
  paddingBottom: 6,
  gap: 6,
});

const BlockchainLabel = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 12,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
});

const DetailRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 8,
  borderBottom: `0.5px solid ${colors.border.default}`,
  '&:last-child': {
    borderBottom: 'none',
  },
});

const DetailLabel = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 12,
  fontWeight: fontWeight.medium,
  color: colors.text.secondary,
});

const DetailValue = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 12,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
});

const DetailValueWithCopy = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
});

const RarityBadge = styled(Box)({
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 4,
  paddingBottom: 4,
  borderRadius: 6,
});

const RarityText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 11,
  fontWeight: fontWeight.bold,
  color: colors.text.primary,
  textTransform: 'capitalize',
});

const ActionButtonsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing.lg,
  marginTop: spacing.lg,
});

const PrimaryButtonBase = styled(ButtonBase)({
  flex: 1,
  maxWidth: 160,
  borderRadius: 14,
  overflow: 'hidden',
  background: gradients.primaryButtonCSS,
  border: '0.5px solid rgba(255, 92, 69, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 52,
  gap: 10,
  transition: 'opacity 0.2s ease',
  '&:hover': { opacity: 0.85 },
  '&:active': { opacity: 0.8 },
});

const SecondaryButtonInner = styled(ButtonBase)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: 52,
  gap: 10,
  position: 'relative',
  zIndex: 1,
  transition: 'opacity 0.2s ease',
  '&:hover': { opacity: 0.85 },
  '&:active': { opacity: 0.8 },
});

const ButtonText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.md,
  fontWeight: fontWeight.medium,
  color: '#e0e0e0',
  lineHeight: 1.5,
});

// ============================================================================
// NftDetailPage Component
// ============================================================================

export function NftDetailPage({
  nft,
  onBack,
  onSendPress,
  onBurnPress,
  style,
  className,
}: NftDetailPageProps): React.ReactElement {
  const handleSendPress = useCallback(() => {
    onSendPress?.();
  }, [onSendPress]);

  const handleBurnPress = useCallback(() => {
    onBurnPress?.();
  }, [onBurnPress]);

  const getBlockchainIcon = useCallback(() => {
    const iconStyle = { fontSize: 16, width: 16, height: 16, color: colors.text.primary };
    if (isSolanaNft(nft)) return <SolanaSvgIcon style={iconStyle} />;
    if (isEthereumNft(nft)) return <EthereumSvgIcon style={iconStyle} />;
    if (isBitcoinNft(nft)) return <BitcoinSvgIcon style={iconStyle} />;
    return null;
  }, [nft]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const renderBlockchainDetails = useCallback(() => {
    if (isSolanaNft(nft)) {
      return (
        <>
          {nft.tokenStandard && (
            <DetailRow>
              <DetailLabel>Token Standard</DetailLabel>
              <DetailValue>{nft.tokenStandard}</DetailValue>
            </DetailRow>
          )}
          {nft.compressed !== undefined && (
            <DetailRow>
              <DetailLabel>Compressed</DetailLabel>
              <DetailValue>{nft.compressed ? 'Yes' : 'No'}</DetailValue>
            </DetailRow>
          )}
          {nft.collectionVerified !== undefined && (
            <DetailRow>
              <DetailLabel>Collection Verified</DetailLabel>
              <DetailValue>{nft.collectionVerified ? '\u2713' : '\u2717'}</DetailValue>
            </DetailRow>
          )}
          {nft.royaltyBps !== undefined && (
            <DetailRow>
              <DetailLabel>Royalties</DetailLabel>
              <DetailValue>{(nft.royaltyBps / 100).toFixed(2)}%</DetailValue>
            </DetailRow>
          )}
        </>
      );
    }

    if (isEthereumNft(nft)) {
      return (
        <>
          <DetailRow>
            <DetailLabel>Token Type</DetailLabel>
            <DetailValue>{nft.tokenType}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Contract</DetailLabel>
            <DetailValueWithCopy>
              <DetailValue>{getShortAddress(nft.contractAddress, 6)}</DetailValue>
              <IconButton
                size="small"
                onClick={() => handleCopy(nft.contractAddress)}
                sx={{ padding: '2px' }}
              >
                <ContentCopyIcon sx={{ fontSize: 14, color: colors.text.secondary }} />
              </IconButton>
            </DetailValueWithCopy>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Token ID</DetailLabel>
            <DetailValue>{getShortAddress(nft.tokenId, 6)}</DetailValue>
          </DetailRow>
          {nft.balance !== undefined && nft.balance > 1 && (
            <DetailRow>
              <DetailLabel>Balance</DetailLabel>
              <DetailValue>{nft.balance}</DetailValue>
            </DetailRow>
          )}
        </>
      );
    }

    if (isBitcoinNft(nft)) {
      return (
        <>
          <DetailRow>
            <DetailLabel>Inscription #</DetailLabel>
            <DetailValue>{nft.inscriptionNumber}</DetailValue>
          </DetailRow>
          {nft.satRarity && (
            <DetailRow>
              <DetailLabel>Rarity</DetailLabel>
              <RarityBadge sx={{ backgroundColor: getSatRarityColor(nft.satRarity) }}>
                <RarityText>{nft.satRarity}</RarityText>
              </RarityBadge>
            </DetailRow>
          )}
          <DetailRow>
            <DetailLabel>Content Type</DetailLabel>
            <DetailValue>{nft.contentType}</DetailValue>
          </DetailRow>
          {nft.genesisHeight && (
            <DetailRow>
              <DetailLabel>Genesis Block</DetailLabel>
              <DetailValue>{nft.genesisHeight}</DetailValue>
            </DetailRow>
          )}
        </>
      );
    }

    return null;
  }, [nft, handleCopy]);

  const renderAttribute = useCallback((attribute: NftAttribute, index: number) => {
    return (
      <AttributeItem key={`${attribute.trait_type}-${index}`}>
        <AttributeName>{attribute.trait_type}</AttributeName>
        <AttributeValue>{attribute.value}</AttributeValue>
      </AttributeItem>
    );
  }, []);

  const blurStyle = {
    borderRadius: 9,
    overflow: 'hidden' as const,
  };

  return (
    <PageShell
      title={nft.name}
      onBack={onBack}
      showScalesBackground
      style={style}
      className={className}
    >
      <ContentContainer>
        {/* Blockchain Badge */}
        <BlockchainBadgeContainer>
          <BlurContainer
            blurIntensity={10}
            blurTint="dark"
            backgroundColor={colors.background.tokenItem}
            borderColor={colors.border.default}
            borderWidth={1}
            style={{ borderRadius: 12, overflow: 'hidden' }}
          >
            <BlockchainBadgeContent>
              {getBlockchainIcon()}
              <BlockchainLabel>{getNftBlockchainLabel(nft)}</BlockchainLabel>
            </BlockchainBadgeContent>
          </BlurContainer>
        </BlockchainBadgeContainer>

        {/* NFT Image */}
        {nft.image && (
          <ImageContainer>
            <NftImage src={nft.image} alt={`NFT image for ${nft.name}`} />
          </ImageContainer>
        )}

        {/* Description Section */}
        {nft.description && (
          <BlurContainer
            blurIntensity={10}
            blurTint="dark"
            backgroundColor={colors.background.tokenItem}
            borderColor={colors.border.default}
            borderWidth={1}
            style={blurStyle}
          >
            <SectionContent>
              <SectionTitle>Description</SectionTitle>
              <DescriptionText>{nft.description}</DescriptionText>
            </SectionContent>
          </BlurContainer>
        )}

        {/* Attributes Section */}
        {nft.attributes && nft.attributes.length > 0 && (
          <BlurContainer
            blurIntensity={10}
            blurTint="dark"
            backgroundColor={colors.background.tokenItem}
            borderColor={colors.border.default}
            borderWidth={1}
            style={blurStyle}
          >
            <SectionContent>
              <SectionTitle>Attributes</SectionTitle>
              <AttributesGrid>
                {nft.attributes.map(renderAttribute)}
              </AttributesGrid>
            </SectionContent>
          </BlurContainer>
        )}

        {/* Blockchain Details Section */}
        {renderBlockchainDetails() && (
          <BlurContainer
            blurIntensity={10}
            blurTint="dark"
            backgroundColor={colors.background.tokenItem}
            borderColor={colors.border.default}
            borderWidth={1}
            style={blurStyle}
          >
            <SectionContent>
              <SectionTitle>Details</SectionTitle>
              {renderBlockchainDetails()}
            </SectionContent>
          </BlurContainer>
        )}

        {/* Action Buttons */}
        <ActionButtonsContainer>
          <PrimaryButtonBase onClick={handleSendPress} aria-label="Send NFT">
            <CallMadeIcon sx={{ fontSize: 15, color: '#e0e0e0' }} />
            <ButtonText>Send</ButtonText>
          </PrimaryButtonBase>

          <BlurContainer
            blurIntensity={2.5}
            backgroundColor="rgba(255, 255, 255, 0.04)"
            borderColor="rgba(255, 92, 69, 0.8)"
            borderWidth={0.5}
            style={{ borderRadius: 14, overflow: 'hidden', flex: 1, maxWidth: 160 }}
          >
            <SecondaryButtonInner onClick={handleBurnPress} aria-label="Burn NFT">
              <LocalFireDepartmentIcon sx={{ fontSize: 15, color: '#e0e0e0' }} />
              <ButtonText>Burn</ButtonText>
            </SecondaryButtonInner>
          </BlurContainer>
        </ActionButtonsContainer>
      </ContentContainer>
    </PageShell>
  );
}

export default NftDetailPage;
