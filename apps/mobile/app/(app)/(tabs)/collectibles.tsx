/**
 * CollectiblesScreen - NFT Gallery
 *
 * Displays:
 * - Title header: "Collectibles"
 * - Grid of NFT cards (2 columns)
 * - NFT detail bottom sheet on tap
 *
 * Features:
 * - Pull-to-refresh
 * - Loading skeleton state
 * - Empty state
 * - Blockchain grouping (Solana primary)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  BackHandler,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import * as Clipboard from 'expo-clipboard';
import {
  useAccountsContext,
  colors,
  componentSizes,
  vs,
  s,
  ms,
  getAllNfts,
  type Nft,
  type SolanaNetwork,
  SOLANA_NETWORKS,
} from '@salmon/shared';
import { NftCard, NftCardSkeleton, WalletHeader, type NftData } from '@salmon/ui';

// ============================================================================
// Types
// ============================================================================

interface NftSection {
  title: string;
  data: Nft[];
}

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NUM_COLUMNS = 2;
const GRID_GAP = s(18);
const HORIZONTAL_PADDING = s(18);
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150; // Pixels to drag before closing
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// Orange gradient for fallback
const FALLBACK_GRADIENT_COLORS: [string, string] = ['rgb(255, 92, 69)', 'rgba(161, 42, 42, 0.9)'];
const FALLBACK_GRADIENT_START = { x: 0.12, y: 0.5 };
const FALLBACK_GRADIENT_END = { x: 0.83, y: 0.5 };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Nft to NftData for NftCard component
 */
function nftToNftData(nft: Nft): NftData {
  return {
    mint: nft.mint.address,
    name: nft.name || 'Unnamed NFT',
    image: nft.media || undefined,
    collectionName: nft.collection?.name || undefined,
  };
}

// ============================================================================
// Skeleton Components
// ============================================================================

/**
 * Skeleton grid for loading state
 * Uses NftCardSkeleton from @salmon/ui with orange gradient and badge
 */
const SkeletonGrid: React.FC = () => {
  return (
    <View style={styles.skeletonGrid}>
      <NftCardSkeleton style={styles.skeletonCard} />
      <NftCardSkeleton style={styles.skeletonCard} />
      <NftCardSkeleton style={styles.skeletonCard} />
      <NftCardSkeleton style={styles.skeletonCard} />
      <NftCardSkeleton style={styles.skeletonCard} />
      <NftCardSkeleton style={styles.skeletonCard} />
    </View>
  );
};

// ============================================================================
// NFT Detail Sheet Component
// ============================================================================

interface NftDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  nft: Nft | null;
  onSend: () => void;
  onBurn: () => void;
}

const NftDetailSheet: React.FC<NftDetailSheetProps> = ({
  visible,
  onClose,
  nft,
  onSend,
  onBurn,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Close handler for worklet
  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Reset image states
      setImageLoading(true);
      setImageError(false);
      // Reset drag position
      dragY.value = 0;
      // Animate sheet up
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      // Fade in backdrop
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Animate sheet down
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      // Fade out backdrop
      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Pan gesture for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        dragY.value = event.translationY;
        // Update backdrop opacity based on drag
        backdropOpacity.value = interpolate(
          event.translationY,
          [0, SCREEN_HEIGHT * 0.5],
          [BACKDROP_OPACITY, 0]
        );
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      // If dragged past threshold or with high velocity, close the sheet
      if (event.translationY > DRAG_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeSheet)();
      } else {
        // Snap back to open position
        dragY.value = withSpring(0, SPRING_CONFIG);
        backdropOpacity.value = withSpring(BACKDROP_OPACITY, SPRING_CONFIG);
      }
    });

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible || !nft) {
    return null;
  }

  const showFallback = !nft.media || imageError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.sheetOverlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.sheetBackdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet Container */}
        <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
          {/* Draggable Header Area */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.sheetDragArea}>
              {/* Drag Handle */}
              <View style={styles.sheetHandleContainer}>
                <View style={styles.sheetHandle} />
              </View>

              {/* Title */}
              <Text style={styles.sheetTitle}>NFT Information</Text>
            </Animated.View>
          </GestureDetector>

          {/* ScrollView Content */}
          <ScrollView
            style={styles.sheetScrollView}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* NFT Image */}
            <View style={styles.nftImageContainer}>
              {showFallback ? (
                <LinearGradient
                  colors={FALLBACK_GRADIENT_COLORS}
                  start={FALLBACK_GRADIENT_START}
                  end={FALLBACK_GRADIENT_END}
                  style={styles.nftImageFallback}
                />
              ) : (
                <>
                  <Image
                    source={{ uri: nft.media! }}
                    style={styles.nftImage}
                    resizeMode="cover"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                  {imageLoading && (
                    <View style={styles.nftImageLoading}>
                      <ActivityIndicator size="large" color={colors.text.primary} />
                    </View>
                  )}
                </>
              )}
            </View>

            {/* NFT Name */}
            <Text style={styles.nftName}>{nft.name || 'Unnamed NFT'}</Text>

            {/* Collection Name */}
            {nft.collection?.name && (
              <Text style={styles.nftCollection}>{nft.collection.name}</Text>
            )}

            {/* Description */}
            {nft.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{nft.description}</Text>
              </View>
            )}

            {/* Attributes */}
            {nft.extras?.attributes && nft.extras.attributes.length > 0 && (
              <View style={styles.attributesContainer}>
                <Text style={styles.attributesLabel}>Attributes</Text>
                <View style={styles.attributesGrid}>
                  {nft.extras.attributes.map((attr, index) => (
                    <View key={index} style={styles.attributeItem}>
                      <Text style={styles.attributeType}>{attr.trait_type}</Text>
                      <Text style={styles.attributeValue}>{String(attr.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.sendButton} onPress={onSend}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.burnButton} onPress={onBurn}>
                <Text style={styles.burnButtonText}>Burn</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function CollectiblesScreen() {
  // Safe area insets for header positioning
  const insets = useSafeAreaInsets();

  // State
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Nft | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Get account context
  const [accountState] = useAccountsContext();
  const { ready, activeBlockchainAccount, networkId, activeAccount } = accountState;

  // Get account info for header
  const accountName = activeAccount?.name || 'Wallet';
  const address = activeBlockchainAccount?.getReceiveAddress() || '';

  // Calculate header offset for content (WalletHeader + title)
  const headerOffset = insets.top + componentSizes.headerInnerHeight;

  // Header handlers
  const handleCopyAddress = useCallback(async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  }, [address]);

  const handleSettingsPress = useCallback(() => {
    // Settings handled in home screen
  }, []);

  const handleWalletPress = useCallback(() => {
    // Wallet switcher handled in home screen
  }, []);

  // Get network configuration
  const network = useMemo<SolanaNetwork | null>(() => {
    if (!networkId) return SOLANA_NETWORKS['mainnet-beta'];
    return SOLANA_NETWORKS[networkId as keyof typeof SOLANA_NETWORKS] || null;
  }, [networkId]);

  // Fetch NFTs
  const fetchNfts = useCallback(async (isRefresh = false) => {
    if (!activeBlockchainAccount || !network) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const address = activeBlockchainAccount.getReceiveAddress();
      const fetchedNfts = await getAllNfts(network, address);
      setNfts(fetchedNfts);
    } catch (error) {
      console.error('[CollectiblesScreen] Failed to fetch NFTs:', error);
      setNfts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBlockchainAccount, network]);

  // Fetch on mount and when account changes
  useEffect(() => {
    if (ready && activeBlockchainAccount && network) {
      fetchNfts();
    }
  }, [ready, activeBlockchainAccount, network, fetchNfts]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    fetchNfts(true);
  }, [fetchNfts]);

  // Handle NFT press
  const handleNftPress = useCallback((nft: Nft) => {
    setSelectedNft(nft);
    setSheetVisible(true);
  }, []);

  // Handle sheet close
  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
    // Clear selected NFT after animation completes
    setTimeout(() => setSelectedNft(null), ANIMATION_DURATION);
  }, []);

  // Handle Send button
  const handleSend = useCallback(() => {
    if (selectedNft) {
      Alert.alert(
        'Send NFT',
        `Send "${selectedNft.name}" functionality coming soon!`,
        [{ text: 'OK' }]
      );
    }
  }, [selectedNft]);

  // Handle Burn button
  const handleBurn = useCallback(() => {
    if (selectedNft) {
      Alert.alert(
        'Burn NFT',
        `Are you sure you want to burn "${selectedNft.name}"? This action cannot be undone.`,
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
  }, [selectedNft]);

  // Group NFTs by blockchain (for future multi-chain support)
  const sections = useMemo<NftSection[]>(() => {
    if (nfts.length === 0) return [];

    // For now, all NFTs are Solana
    return [
      {
        title: 'Solana',
        data: nfts,
      },
    ];
  }, [nfts]);

  // Render NFT card item
  const renderNftItem = useCallback(({ item }: { item: Nft }) => {
    return (
      <NftCard
        nft={nftToNftData(item)}
        onPress={() => handleNftPress(item)}
        style={styles.nftCard}
      />
    );
  }, [handleNftPress]);

  // Render section header (for blockchain grouping)
  const renderSectionHeader = useCallback((title: string) => {
    // Only show header if we have multiple sections (future multi-chain)
    if (sections.length <= 1) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    );
  }, [sections.length]);

  // Render header component (spacing for fixed header + section title)
  const ListHeaderComponent = useMemo(() => (
    <View style={[styles.headerContainer, { paddingTop: headerOffset + vs(8) }]}>
      {/* Collectibles Title */}
      <Text style={styles.pageTitle}>Collectibles</Text>
      {sections.length > 0 && sections[0] && renderSectionHeader(sections[0].title)}
    </View>
  ), [sections, renderSectionHeader, headerOffset]);

  // Render empty component
  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <SkeletonGrid />;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Collectibles</Text>
        <Text style={styles.emptySubtext}>
          Your NFTs will appear here once you receive some
        </Text>
      </View>
    );
  }, [loading]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Nft) => item.mint.address, []);

  // All NFTs flattened for FlatList
  const flattenedNfts = useMemo(() => {
    return sections.flatMap(section => section.data);
  }, [sections]);

  // Loading state - wait for account to be ready
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* WalletHeader - Absolutely positioned above content */}
      <WalletHeader
        accountName={accountName}
        address={address}
        onCopyAddress={handleCopyAddress}
        onSettingsPress={handleSettingsPress}
        onWalletPress={handleWalletPress}
      />

      <FlatList
        data={flattenedNfts}
        renderItem={renderNftItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text.primary}
            colors={['#FF6B35']}
          />
        }
      />

      {/* NFT Detail Sheet */}
      <NftDetailSheet
        visible={sheetVisible}
        onClose={handleSheetClose}
        nft={selectedNft}
        onSend={handleSend}
        onBurn={handleBurn}
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
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: ms(16),
    marginTop: vs(16),
  },
  headerContainer: {
    paddingBottom: vs(16),
  },
  pageTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(19.44),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.19,
    marginBottom: vs(16),
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: vs(componentSizes.tabBarScrollPadding),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  nftCard: {
    // NftCard has its own sizing, but ensure it fits in 2-column grid
    flex: 1,
    maxWidth: `${(100 - 2) / 2}%`, // Account for gap
  },

  // Section Header
  sectionHeader: {
    paddingVertical: vs(12),
  },
  sectionTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(16),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
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

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },
  skeletonCard: {
    // NftCardSkeleton already has its own sizing (194x193)
    // Just need to ensure proper spacing in grid
  },

  // NFT Detail Sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    backgroundColor: '#161c2d',
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    borderTopWidth: 0.75,
    borderTopColor: '#404962',
    height: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  sheetDragArea: {
    // This area is draggable
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  sheetHandle: {
    width: s(70),
    height: vs(6),
    borderRadius: 75,
    backgroundColor: '#b9b9b9',
    opacity: 0.4,
  },
  sheetTitle: {
    fontSize: ms(24),
    fontFamily: 'DMSansExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vs(15),
    letterSpacing: ms(-0.12, 0.3),
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: s(18),
    paddingBottom: vs(40),
  },

  // NFT Detail Content
  nftImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: ms(18),
    overflow: 'hidden',
    marginBottom: vs(16),
    backgroundColor: colors.skeleton.base,
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  nftImageFallback: {
    width: '100%',
    height: '100%',
  },
  nftImageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nftName: {
    fontFamily: 'DMSansExtraBold',
    fontSize: ms(24),
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: vs(4),
  },
  nftCollection: {
    fontFamily: 'DMSans-Medium',
    fontSize: ms(16),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: vs(16),
  },

  // Description
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ms(12),
    padding: s(16),
    marginBottom: vs(16),
  },
  descriptionLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: vs(8),
  },
  descriptionText: {
    fontFamily: 'DMSans-Regular',
    fontSize: ms(14),
    color: colors.text.primary,
    lineHeight: ms(20),
  },

  // Attributes
  attributesContainer: {
    marginBottom: vs(16),
  },
  attributesLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: vs(12),
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  attributeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ms(10),
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    minWidth: s(80),
  },
  attributeType: {
    fontFamily: 'DMSans-Medium',
    fontSize: ms(11),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: vs(2),
    textTransform: 'uppercase',
  },
  attributeValue: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: ms(13),
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(8),
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: ms(12),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: ms(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  burnButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ms(12),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.3)',
  },
  burnButtonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: ms(16),
    fontWeight: '700',
    color: '#FF5C45',
  },
});
