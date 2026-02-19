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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  colors,
  gradients,
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

// Font family constants
const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
  extraBold: 'DMSansExtraBold',
  black: 'DMSansBlack',
} as const;

/**
 * Burn/Fire icon for NFT burning action
 * Simple flame icon using SVG Path
 */
const BurnIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#FFFFFF',
}) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7, color }}>🔥</Text>
    </View>
  );
};

// Fallback gradient for NFTs without images (matches NftCard)
const FALLBACK_GRADIENT = {
  colors: ['rgb(255, 92, 69)', 'rgba(161, 42, 42, 0.9)'] as const,
  start: { x: 0.12, y: 0.5 },
  end: { x: 0.83, y: 0.5 },
};

export const NftDetailSheet: React.FC<NftDetailSheetProps> = ({
  visible,
  onClose,
  nft,
  onSendPress,
  onBurnPress,
  style,
}) => {
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
              <Text style={styles.detailLabel}>Token Standard</Text>
              <Text style={styles.detailValue}>{nft.tokenStandard}</Text>
            </View>
          )}
          {nft.compressed !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Compressed</Text>
              <Text style={styles.detailValue}>{nft.compressed ? 'Yes' : 'No'}</Text>
            </View>
          )}
          {nft.collectionVerified !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Collection Verified</Text>
              <Text style={styles.detailValue}>{nft.collectionVerified ? '✓' : '✗'}</Text>
            </View>
          )}
          {nft.royaltyBps !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Royalties</Text>
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
            <Text style={styles.detailLabel}>Token Type</Text>
            <Text style={styles.detailValue}>{nft.tokenType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contract</Text>
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
            <Text style={styles.detailLabel}>Token ID</Text>
            <Text style={styles.detailValue}>{getShortAddress(nft.tokenId, 6)}</Text>
          </View>
          {nft.balance !== undefined && nft.balance > 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
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
            <Text style={styles.detailLabel}>Inscription #</Text>
            <Text style={styles.detailValue}>{nft.inscriptionNumber}</Text>
          </View>
          {nft.satRarity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rarity</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getSatRarityColor(nft.satRarity) }]}>
                <Text style={styles.rarityText}>{nft.satRarity}</Text>
              </View>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Content Type</Text>
            <Text style={styles.detailValue}>{nft.contentType}</Text>
          </View>
          {nft.genesisHeight && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Genesis Block</Text>
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
              <Text style={styles.sectionTitle}>Description</Text>
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
              <Text style={styles.sectionTitle}>Attributes</Text>
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
            <Text style={styles.sectionTitle}>Details</Text>
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
              colors={gradients.primaryButton.colors}
              start={gradients.primaryButton.start}
              end={gradients.primaryButton.end}
              style={styles.primaryButton}
            >
              <CallMadeSvgIcon size={ms(15)} color="#e0e0e0" />
              <Text style={styles.buttonText}>Send</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Burn Button - Secondary with Glass Effect */}
          <BlurContainer
            style={styles.secondaryButtonWrapper}
            blurIntensity={2.5}
            backgroundColor="rgba(255, 255, 255, 0.04)"
            borderColor="rgba(255, 92, 69, 0.8)"
            borderWidth={0.5}
          >
            <TouchableOpacity
              style={styles.secondaryButtonContent}
              onPress={handleBurnPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Burn NFT"
            >
              <BurnIcon size={ms(15)} color="#e0e0e0" />
              <Text style={styles.buttonText}>Burn</Text>
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
    fontSize: ms(24),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(8),
    paddingHorizontal: s(18),
    letterSpacing: ms(-0.32, 0.3),
  },
  blockchainBadgeContainer: {
    alignItems: 'center',
    marginBottom: vs(16),
  },
  blockchainBadge: {
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  blockchainBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    gap: s(6),
  },
  blockchainLabel: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: s(18),
    paddingBottom: vs(40),
    gap: vs(16),
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: vs(8),
  },
  nftImage: {
    width: s(406),
    height: s(406),
    borderRadius: ms(18),
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionContainer: {
    borderRadius: ms(9),
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    backgroundColor: colors.background.tokenItem,
  },
  sectionContent: {
    padding: s(7),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  descriptionText: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
    lineHeight: ms(18),
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -s(6),
  },
  attributeItem: {
    width: '50%',
    paddingHorizontal: s(6),
    paddingVertical: vs(8),
  },
  attributeName: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.black,
    color: colors.text.primary,
    marginBottom: vs(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attributeValue: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(8),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  detailLabel: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
  },
  detailValueWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  rarityBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: ms(6),
  },
  rarityText: {
    fontSize: ms(11),
    fontFamily: FONT_FAMILY.bold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(16),
    marginTop: vs(16),
  },
  buttonWrapper: {
    borderRadius: ms(14),
    overflow: 'hidden',
    flex: 1,
    maxWidth: s(160),
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(52),
    paddingHorizontal: s(20),
    gap: s(10),
    borderRadius: ms(14),
    borderWidth: 0.5,
    borderColor: 'rgba(255, 92, 69, 0.8)',
  },
  secondaryButtonWrapper: {
    borderRadius: ms(14),
    overflow: 'hidden',
    flex: 1,
    maxWidth: s(160),
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(52),
    paddingHorizontal: s(20),
    gap: s(10),
  },
  buttonText: {
    fontSize: ms(16),
    fontWeight: '500',
    color: '#e0e0e0',
    lineHeight: ms(16 * 1.5),
  },
});

export default NftDetailSheet;
