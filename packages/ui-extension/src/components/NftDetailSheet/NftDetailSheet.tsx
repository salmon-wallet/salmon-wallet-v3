/**
 * NftDetailSheet - Dialog for displaying detailed NFT information
 *
 * Web version using MUI Dialog for browser extension.
 * Migrated from React Native NftDetailSheet (bottom sheet modal).
 *
 * Features:
 * - MUI Dialog container following TokenInformationSheet pattern
 * - Scrollable content with NFT image, description, and attributes
 * - Send and Burn action buttons with gradient/glass styling
 * - ScalesBackground decorative pattern
 * - BlurContainer sections for description and attributes
 *
 * @example
 * ```tsx
 * <NftDetailSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   nft={selectedNft}
 *   onSendPress={() => handleSend()}
 *   onBurnPress={() => handleBurn()}
 * />
 * ```
 */

import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CallMadeIcon from '@mui/icons-material/CallMade';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

import {
  colors,
  spacing,
  borderRadius,
  gradients,
  fontFamily,
  fontWeight,
  fontSize,
} from '@salmon/shared';

import { BlurContainer } from '../BlurContainer';
import { ScalesBackground } from '../ScalesBackground';
import type { NftDetailSheetProps, NftAttribute } from './types';

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.border.default}`,
    minWidth: 380,
    maxWidth: 440,
    maxHeight: '85vh',
    overflow: 'hidden',
    position: 'relative',
  },
});

const HandleContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: spacing.md,
  paddingBottom: spacing.sm,
  position: 'relative',
  zIndex: 2,
});

const Handle = styled(Box)({
  width: 70,
  height: 6,
  borderRadius: 100,
  backgroundColor: colors.sheet.handle,
  opacity: 0.4,
});

const NftName = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize['2xl'],
  fontWeight: 800,
  color: colors.text.primary,
  textAlign: 'center',
  marginBottom: spacing.lg,
  paddingLeft: spacing.headerPadding,
  paddingRight: spacing.headerPadding,
  letterSpacing: -0.32,
  position: 'relative',
  zIndex: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 1,
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: colors.border.default,
    borderRadius: 2,
  },
});

const ContentContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
  paddingLeft: spacing.headerPadding,
  paddingRight: spacing.headerPadding,
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
  '&:hover': {
    opacity: 0.85,
  },
  '&:active': {
    opacity: 0.8,
  },
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
  '&:hover': {
    opacity: 0.85,
  },
  '&:active': {
    opacity: 0.8,
  },
});

const ButtonText = styled(Typography)({
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: fontSize.md,
  fontWeight: fontWeight.medium,
  color: '#e0e0e0',
  lineHeight: 1.5,
});

// ============================================================================
// NftDetailSheet Component
// ============================================================================

export function NftDetailSheet({
  visible,
  onClose,
  nft,
  onSendPress,
  onBurnPress,
  style,
  className,
}: NftDetailSheetProps): React.ReactElement | null {
  const handleSendPress = useCallback(() => {
    onSendPress?.();
  }, [onSendPress]);

  const handleBurnPress = useCallback(() => {
    onBurnPress?.();
  }, [onBurnPress]);

  const renderAttribute = useCallback((attribute: NftAttribute, index: number) => {
    return (
      <AttributeItem key={`${attribute.trait_type}-${index}`}>
        <AttributeName>{attribute.trait_type}</AttributeName>
        <AttributeValue>{attribute.value}</AttributeValue>
      </AttributeItem>
    );
  }, []);

  if (!nft) {
    return null;
  }

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="nft-detail-title"
      className={className}
      PaperProps={{
        style,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: colors.dialog.overlay,
          },
        },
      }}
    >
      {/* Scales Background - positioned behind content */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: `${borderRadius.xl}px`,
        }}
      >
        <ScalesBackground />
      </Box>

      {/* Drag Handle (decorative in web) */}
      <HandleContainer>
        <Handle />
      </HandleContainer>

      {/* NFT Name */}
      <NftName id="nft-detail-title">
        {nft.name}
      </NftName>

      {/* Scrollable Content */}
      <StyledDialogContent>
        <ContentContainer>
          {/* NFT Image */}
          {nft.image && (
            <ImageContainer>
              <NftImage
                src={nft.image}
                alt={`NFT image for ${nft.name}`}
              />
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
              style={{
                borderRadius: 9,
                overflow: 'hidden',
              }}
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
              style={{
                borderRadius: 9,
                overflow: 'hidden',
              }}
            >
              <SectionContent>
                <SectionTitle>Attributes</SectionTitle>
                <AttributesGrid>
                  {nft.attributes.map(renderAttribute)}
                </AttributesGrid>
              </SectionContent>
            </BlurContainer>
          )}

          {/* Action Buttons */}
          <ActionButtonsContainer>
            {/* Send Button - Primary with gradient */}
            <PrimaryButtonBase
              onClick={handleSendPress}
              aria-label="Send NFT"
            >
              <CallMadeIcon sx={{ fontSize: 15, color: '#e0e0e0' }} />
              <ButtonText>Send</ButtonText>
            </PrimaryButtonBase>

            {/* Burn Button - Secondary with glass effect */}
            <BlurContainer
              blurIntensity={2.5}
              backgroundColor="rgba(255, 255, 255, 0.04)"
              borderColor="rgba(255, 92, 69, 0.8)"
              borderWidth={0.5}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                flex: 1,
                maxWidth: 160,
              }}
            >
              <SecondaryButtonInner
                onClick={handleBurnPress}
                aria-label="Burn NFT"
              >
                <LocalFireDepartmentIcon sx={{ fontSize: 15, color: '#e0e0e0' }} />
                <ButtonText>Burn</ButtonText>
              </SecondaryButtonInner>
            </BlurContainer>
          </ActionButtonsContainer>
        </ContentContainer>
      </StyledDialogContent>
    </StyledDialog>
  );
}

export default NftDetailSheet;
