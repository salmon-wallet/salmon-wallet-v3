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

import React, { useCallback, useState } from 'react';
import { styled } from '../../utils/styled';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
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
  shadowsCSS,
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
  boxShadow: shadowsCSS.header,
});

const SectionContent = styled(Box)({
  padding: spacing.sm,
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
  marginLeft: -spacing.sm,
  marginRight: -spacing.sm,
});

const AttributeItem = styled(Box)({
  width: '50%',
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
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
  paddingLeft: spacing.md,
  paddingRight: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  gap: spacing.sm,
});

const BlockchainLabel = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
});

const DetailRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: spacing.sm,
  paddingBottom: spacing.sm,
  borderBottom: `0.5px solid ${colors.border.default}`,
  '&:last-child': {
    borderBottom: 'none',
  },
});

const DetailLabel = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.text.secondary,
});

const DetailValue = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
});

const DetailValueWithCopy = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
});

const RarityBadge = styled(Box)({
  paddingLeft: spacing.sm,
  paddingRight: spacing.sm,
  paddingTop: spacing.xs,
  paddingBottom: spacing.xs,
  borderRadius: 6,
});

const RarityText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.xs,
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
  border: `0.5px solid ${colors.accent.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 52,
  gap: spacing.base,
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
  gap: spacing.base,
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
  color: colors.text.balance,
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
    const iconStyle = { fontSize: fontSize.md, width: 16, height: 16, color: colors.text.primary };
    if (isSolanaNft(nft)) return <SolanaSvgIcon style={iconStyle} />;
    if (isEthereumNft(nft)) return <EthereumSvgIcon style={iconStyle} />;
    if (isBitcoinNft(nft)) return <BitcoinSvgIcon style={iconStyle} />;
    return null;
  }, [nft]);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(text);
    setTimeout(() => setCopiedField(null), 1500);
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
                sx={{ padding: `${spacing['2xs']}px` }}
              >
                {copiedField === nft.contractAddress ? (
                  <CheckIcon sx={{ fontSize: fontSize.base, color: colors.status.success }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: fontSize.base, color: colors.text.secondary }} />
                )}
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
  }, [nft, handleCopy, copiedField]);

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
            <CallMadeIcon sx={{ fontSize: fontSize.md, color: colors.text.balance }} />
            <ButtonText>Send</ButtonText>
          </PrimaryButtonBase>

          <BlurContainer
            blurIntensity={2.5}
            backgroundColor={colors.interactive.surface}
            borderColor={colors.accent.border}
            borderWidth={0.5}
            style={{ borderRadius: 14, overflow: 'hidden', flex: 1, maxWidth: 160 }}
          >
            <SecondaryButtonInner onClick={handleBurnPress} aria-label="Burn NFT">
              <LocalFireDepartmentIcon sx={{ fontSize: fontSize.md, color: colors.text.balance }} />
              <ButtonText>Burn</ButtonText>
            </SecondaryButtonInner>
          </BlurContainer>
        </ActionButtonsContainer>
      </ContentContainer>
    </PageShell>
  );
}

export default NftDetailPage;
