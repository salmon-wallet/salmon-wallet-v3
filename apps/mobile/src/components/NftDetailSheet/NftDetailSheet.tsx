import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  colors,
  fontSize,
  borderRadius,
  fontFamilyNative,
  gradients,
  shadows,
  componentSizes,
  ms,
  vs,
  s,
  isSolanaNft,
  isEthereumNft,
  isBitcoinNft,
  getNftBlockchainLabel,
  getSatRarityColor,
  getShortAddress,
  borderWidth,
  letterSpacing,
  lineHeight,
  spacing,
  fontWeight,
} from '@salmon/shared';
import {
  CallMadeSvgIcon,
  SolanaSvgIcon,
  EthereumSvgIcon,
  BitcoinSvgIcon,
  ContentCopySvgIcon,
} from '../Icon/SvgIcons';
import { BlurContainer } from '../BlurContainer';
import { BottomSheetContainer } from '../BottomSheetContainer';
import type { NftDetailSheetProps, NftAttribute } from './types';

/**
 * Burn/Fire icon for NFT burning action
 * Simple flame icon using SVG Path
 */
const BurnIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = colors.text.primary,
}) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7, color }}>🔥</Text>
    </View>
  );
};

// Fallback gradient for NFTs without images (matches NftCard)
const FALLBACK_GRADIENT = {
  colors: [...gradients.primaryButton.colors],
  start: { x: 0.12, y: 0.5 },
  end: { x: 0.83, y: 0.5 },
} as const;

export const NftDetailSheet: React.FC<NftDetailSheetProps> = ({
  visible,
  onClose,
  nft,
  onSendPress,
  onBurnPress,
  style,
}) => {
  const { t } = useTranslation();
  // Image loading/error state
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);
  const [prevMint, setPrevMint] = React.useState<string | undefined>(undefined);

  // Reset image state synchronously during render when nft changes.
  // Using useEffect for this causes a race condition: expo-image may fire
  // onLoadEnd (from memory cache) before the effect runs, and the effect
  // then overwrites imageLoading back to true permanently.
  if (nft?.mint !== prevMint) {
    setPrevMint(nft?.mint);
    setImageLoading(true);
    setImageError(false);
  }

  // Top fade gradient opacity (driven by scroll offset)
  const topFadeOpacity = useMemo(() => new Animated.Value(0), []);

  // Handle send press
  const handleSendPress = useCallback(() => {
    onSendPress?.();
  }, [onSendPress]);

  // Handle burn press
  const handleBurnPress = useCallback(() => {
    onBurnPress?.();
  }, [onBurnPress]);

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(offsetY / componentSizes.sheetFadeGradientHeight, 1);
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

  // Render single attribute item
  const renderAttribute = useCallback((attribute: NftAttribute, index: number) => {
    return (
      <View key={`${attribute.trait_type}-${index}`} style={styles.attributeItem}>
        <Text style={styles.attributeName}>{attribute.trait_type}</Text>
        <Text style={styles.attributeValue}>{attribute.value}</Text>
      </View>
    );
  }, []);

  // Get blockchain icon component
  const getBlockchainIcon = useCallback(() => {
    if (!nft) return null;

    const iconSize = ms(16);
    const iconColor = colors.text.primary;

    if (isSolanaNft(nft)) {
      return <SolanaSvgIcon size={iconSize} color={iconColor} />;
    } else if (isEthereumNft(nft)) {
      return <EthereumSvgIcon size={iconSize} color={iconColor} />;
    } else if (isBitcoinNft(nft)) {
      return <BitcoinSvgIcon size={iconSize} color={iconColor} />;
    }
    return null;
  }, [nft]);

  // Render blockchain-specific details
  const renderBlockchainDetails = useCallback(() => {
    if (!nft) return null;

    // Solana-specific fields
    if (isSolanaNft(nft)) {
      return (
        <>
          {nft.tokenStandard && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.tokenStandard', 'Token Standard')}</Text>
              <Text style={styles.detailValue}>{nft.tokenStandard}</Text>
            </View>
          )}
          {nft.compressed !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.compressed', 'Compressed')}</Text>
              <Text style={styles.detailValue}>{nft.compressed ? 'Yes' : 'No'}</Text>
            </View>
          )}
          {nft.collectionVerified !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.collectionVerified', 'Collection Verified')}</Text>
              <Text style={styles.detailValue}>{nft.collectionVerified ? '✓' : '✗'}</Text>
            </View>
          )}
          {nft.royaltyBps !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.royalties', 'Royalties')}</Text>
              <Text style={styles.detailValue}>{(nft.royaltyBps / 100).toFixed(2)}%</Text>
            </View>
          )}
        </>
      );
    }

    // Ethereum-specific fields
    if (isEthereumNft(nft)) {
      return (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('nft.detail.tokenType', 'Token Type')}</Text>
            <Text style={styles.detailValue}>{nft.tokenType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('nft.detail.contract', 'Contract')}</Text>
            <View style={styles.detailValueWithCopy}>
              <Text style={styles.detailValue}>{getShortAddress(nft.contractAddress, 6)}</Text>
              <TouchableOpacity
                onPress={() => {
                  // Copy functionality can be added here
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ContentCopySvgIcon size={ms(14)} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('nft.detail.tokenId', 'Token ID')}</Text>
            <Text style={styles.detailValue}>{getShortAddress(nft.tokenId, 6)}</Text>
          </View>
          {nft.balance !== undefined && nft.balance > 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.balance', 'Balance')}</Text>
              <Text style={styles.detailValue}>{nft.balance}</Text>
            </View>
          )}
        </>
      );
    }

    // Bitcoin-specific fields
    if (isBitcoinNft(nft)) {
      return (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('nft.detail.inscriptionNumber', 'Inscription #')}</Text>
            <Text style={styles.detailValue}>{nft.inscriptionNumber}</Text>
          </View>
          {nft.satRarity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.rarity', 'Rarity')}</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getSatRarityColor(nft.satRarity) }]}>
                <Text style={styles.rarityText}>{nft.satRarity}</Text>
              </View>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('nft.detail.contentType', 'Content Type')}</Text>
            <Text style={styles.detailValue}>{nft.contentType}</Text>
          </View>
          {nft.genesisHeight && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('nft.detail.genesisBlock', 'Genesis Block')}</Text>
              <Text style={styles.detailValue}>{nft.genesisHeight}</Text>
            </View>
          )}
        </>
      );
    }

    return null;
  }, [nft]);

  if (!visible || !nft) {
    return null;
  }

  // Custom header: NFT name + blockchain badge
  const headerContent = (
    <>
      {/* NFT Name */}
      <Text style={styles.nftName} numberOfLines={2}>
        {nft.name}
      </Text>

      {/* Blockchain Badge */}
      <View style={styles.blockchainBadgeContainer}>
        <BlurView
          intensity={10}
          tint="dark"
          style={styles.blockchainBadge}
        >
          <View style={styles.blockchainBadgeContent}>
            {getBlockchainIcon()}
            <Text style={styles.blockchainLabel}>{getNftBlockchainLabel(nft)}</Text>
          </View>
        </BlurView>
      </View>
    </>
  );

  return (
    <BottomSheetContainer
      visible={visible}
      onClose={onClose}
      headerContent={headerContent}
      showFadeGradient
      fadeGradientTop={vs(12) + vs(8) + ms(24) + vs(16)}
      scrollOffsetValue={topFadeOpacity}
      showTextureOverlay
      style={[styles.sheetContainer, style]}
    >
      {/* ScrollView Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* NFT Image */}
        <View style={styles.imageContainer}>
          {!nft.image || imageError ? (
            <LinearGradient
              colors={[...FALLBACK_GRADIENT.colors]}
              start={FALLBACK_GRADIENT.start}
              end={FALLBACK_GRADIENT.end}
              style={styles.nftImage}
            />
          ) : (
            <>
              <Image
                source={nft.image}
                style={styles.nftImage}
                contentFit="cover"
                autoplay={true}
                recyclingKey={nft.mint}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View style={[styles.nftImage, styles.imageLoadingOverlay]}>
                  <LinearGradient
                    colors={[...FALLBACK_GRADIENT.colors]}
                    start={FALLBACK_GRADIENT.start}
                    end={FALLBACK_GRADIENT.end}
                    style={StyleSheet.absoluteFill}
                  />
                  <ActivityIndicator size="small" color={colors.text.primary} />
                </View>
              )}
            </>
          )}
        </View>

        {/* Description Section */}
        {nft.description && (
          <BlurView
            intensity={10}
            tint="dark"
            style={styles.sectionContainer}
          >
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('nft.detail.description', 'Description')}</Text>
              <Text style={styles.descriptionText}>{nft.description}</Text>
            </View>
          </BlurView>
        )}

        {/* Attributes Section */}
        {nft.attributes && nft.attributes.length > 0 && (
          <BlurView
            intensity={10}
            tint="dark"
            style={styles.sectionContainer}
          >
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('nft.detail.attributes', 'Attributes')}</Text>
              <View style={styles.attributesGrid}>
                {nft.attributes.map(renderAttribute)}
              </View>
            </View>
          </BlurView>
        )}

        {/* Details Section - Blockchain-specific fields */}
        <BlurView
          intensity={10}
          tint="dark"
          style={styles.sectionContainer}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>{t('nft.detail.details', 'Details')}</Text>
            {renderBlockchainDetails()}
          </View>
        </BlurView>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Send Button - Primary */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSendPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Send NFT"
          >
            <LinearGradient
              colors={[...gradients.primaryButton.colors]}
              start={gradients.primaryButton.start}
              end={gradients.primaryButton.end}
              style={styles.primaryButton}
            >
              <CallMadeSvgIcon size={ms(15)} color={colors.text.balance} />
              <Text style={styles.buttonText}>{t('actions.send', 'Send')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Burn Button - Secondary with Glass Effect */}
          <BlurContainer
            style={styles.secondaryButtonWrapper}
            blurIntensity={2.5}
            backgroundColor={colors.interactive.surface}
            borderColor={colors.accent.border}
            borderWidth={borderWidth.actionButton}
          >
            <TouchableOpacity
              style={styles.secondaryButtonContent}
              onPress={handleBurnPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Burn NFT"
            >
              <BurnIcon size={ms(15)} color={colors.text.balance} />
              <Text style={styles.buttonText}>{t('nft.burn_nft', 'Burn')}</Text>
            </TouchableOpacity>
          </BlurContainer>
        </View>
      </ScrollView>
    </BottomSheetContainer>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    maxHeight: '90%',
    minHeight: undefined,
    overflow: 'hidden',
  },
  nftName: {
    fontSize: ms(fontSize['2xl']),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(spacing.sm),
    paddingHorizontal: s(spacing.headerPadding),
    letterSpacing: ms(-0.32, 0.3),
  },
  blockchainBadgeContainer: {
    alignItems: 'center',
    marginBottom: vs(spacing.lg),
  },
  blockchainBadge: {
    borderRadius: ms(borderRadius.lg),
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  blockchainBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(spacing.md),
    paddingVertical: vs(spacing.xs),
    gap: s(spacing.xs),
  },
  blockchainLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(spacing['4xl']),
    gap: vs(spacing.lg),
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: vs(spacing.sm),
  },
  nftImage: {
    width: s(componentSizes.nftImageMaxWidth),
    height: s(componentSizes.nftImageMaxWidth),
    borderRadius: ms(borderRadius.iconContainer),
    ...shadows.imageHero,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionContainer: {
    borderRadius: ms(borderRadius.badge),
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  sectionContent: {
    padding: s(spacing.sm),
  },
  sectionTitle: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    marginBottom: vs(spacing.sm),
  },
  descriptionText: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
    lineHeight: ms(fontSize.sm * lineHeight.normal),
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -s(spacing.xs),
  },
  attributeItem: {
    width: '50%',
    paddingHorizontal: s(spacing.xs),
    paddingVertical: vs(spacing.sm),
  },
  attributeName: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    marginBottom: vs(spacing.xs),
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wider,
  },
  attributeValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(spacing.sm),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  detailLabel: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.medium,
    color: colors.text.primary,
  },
  detailValueWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.sm),
  },
  rarityBadge: {
    paddingHorizontal: s(spacing.sm),
    paddingVertical: vs(spacing.xs),
    borderRadius: ms(borderRadius.sm),
  },
  rarityText: {
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(spacing.lg),
    marginTop: vs(spacing.lg),
  },
  buttonWrapper: {
    borderRadius: ms(borderRadius.button),
    overflow: 'hidden',
    flex: 1,
    maxWidth: s(componentSizes.buttonMinWidthLg),
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(componentSizes.iconSize4XL),
    paddingHorizontal: s(spacing.xl),
    gap: s(spacing.base),
    borderRadius: ms(borderRadius.button),
    borderWidth: borderWidth.actionButton,
    borderColor: colors.accent.border,
  },
  secondaryButtonWrapper: {
    borderRadius: ms(borderRadius.button),
    overflow: 'hidden',
    flex: 1,
    maxWidth: s(componentSizes.buttonMinWidthLg),
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(componentSizes.iconSize4XL),
    paddingHorizontal: s(spacing.xl),
    gap: s(spacing.base),
  },
  buttonText: {
    fontSize: ms(fontSize.md),
    fontWeight: fontWeight.medium,
    color: colors.text.balance,
    lineHeight: ms(16 * lineHeight.normal),
  },
});

export default NftDetailSheet;
