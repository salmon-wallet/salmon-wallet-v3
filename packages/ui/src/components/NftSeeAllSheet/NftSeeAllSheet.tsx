import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
  Platform,
  BackHandler,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  shadows,
  borderRadius,
  borderWidth,
  componentSizes,
  ms,
  vs,
  s,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { NftCard, NftCardSkeleton } from '../NftCard';
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon';
import type { NftSeeAllSheetProps } from './types';
import type { NftBlockchain } from '../NftCarouselSection';
import type { NftData } from '../NftCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation constants
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// Grid constants
const NUM_COLUMNS = 2;
const GRID_GAP = s(18);
const HORIZONTAL_PADDING = s(18);

/**
 * Get blockchain icon component based on blockchain type
 */
const getBlockchainIcon = (blockchain: NftBlockchain, size: number = 24) => {
  switch (blockchain) {
    case 'solana':
      return <SolanaSvgIcon size={size} color={colors.text.primary} />;
    case 'ethereum':
      return <EthereumSvgIcon size={size} color={colors.text.primary} />;
    case 'bitcoin':
      return <BitcoinSvgIcon size={size} color={colors.text.primary} />;
    default:
      return null;
  }
};

/**
 * Skeleton grid for loading state
 */
const SkeletonGrid: React.FC = () => {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.skeletonRow}>
          <NftCardSkeleton style={styles.skeletonCard} />
          <NftCardSkeleton style={styles.skeletonCard} />
        </View>
      ))}
    </View>
  );
};

/**
 * NftSeeAllSheet - Fullscreen bottom sheet with NFT grid
 *
 * Shows all NFTs from a blockchain in a 2-column grid layout.
 * Features drag-to-dismiss, smooth animations, and proper Android back handling.
 *
 * @example
 * ```tsx
 * <NftSeeAllSheet
 *   visible={showSeeAll}
 *   onClose={() => setShowSeeAll(false)}
 *   title="Solana NFTs"
 *   blockchain="solana"
 *   nfts={solanaCollection}
 *   onNftPress={(nft) => showDetail(nft)}
 * />
 * ```
 */
export const NftSeeAllSheet: React.FC<NftSeeAllSheetProps> = ({
  visible,
  onClose,
  title,
  blockchain,
  nfts,
  loading = false,
  onNftPress,
  style,
}) => {
  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Top fade gradient opacity
  const topFadeOpacity = useRef(new Animated.Value(0)).current;

  // Close handler for worklet
  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
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

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

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

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const opacity = Math.min(offsetY / componentSizes.sheetFadeGradientHeight, 1);
      topFadeOpacity.setValue(opacity);
    },
    [topFadeOpacity]
  );

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Render NFT item
  const renderNftItem = useCallback(
    ({ item }: { item: NftData }) => {
      return (
        <NftCard
          nft={item}
          onPress={() => onNftPress?.(item)}
          style={styles.nftCard}
        />
      );
    },
    [onNftPress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: NftData) => item.mint, []);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <ReanimatedAnimated.View style={[styles.backdrop, backdropAnimatedStyle]} />
          </TouchableWithoutFeedback>

          {/* Sheet Container */}
          <ReanimatedAnimated.View style={[styles.sheetContainer, sheetAnimatedStyle, style]}>
            {/* Scales Background */}
            <ScalesBackground />

            {/* Texture overlay */}
            <View style={styles.textureOverlay} />

            {/* Draggable Header Area */}
            <GestureDetector gesture={panGesture}>
              <ReanimatedAnimated.View style={styles.dragArea}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Title with blockchain icon */}
                <View style={styles.titleContainer}>
                  {getBlockchainIcon(blockchain, ms(24))}
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.count}>({nfts.length})</Text>
                </View>
              </ReanimatedAnimated.View>
            </GestureDetector>

            {/* Grid Content */}
            {loading ? (
              <View style={styles.scrollContent}>
                <SkeletonGrid />
              </View>
            ) : (
              <FlatList
                data={nfts}
                renderItem={renderNftItem}
                keyExtractor={keyExtractor}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
            )}

            {/* Top fade gradient */}
            <Animated.View
              style={[styles.topFadeGradient, { opacity: topFadeOpacity }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[colors.background.secondary, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </ReanimatedAnimated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.sheet.backdrop,
  },
  sheetContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: ms(borderRadius.card),
    borderTopRightRadius: ms(borderRadius.card),
    borderTopWidth: borderWidth.sheet,
    borderTopColor: colors.border.default,
    height: '90%',
    overflow: 'hidden',
    ...shadows.sheet,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.4,
  },
  dragArea: {
    // This area is draggable
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  handle: {
    width: s(componentSizes.sheetHandleWidth),
    height: vs(componentSizes.sheetHandleHeight),
    borderRadius: 100,
    backgroundColor: colors.sheet.handle,
    opacity: componentSizes.sheetHandleOpacity,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginBottom: vs(16),
    paddingHorizontal: s(18),
  },
  title: {
    fontSize: ms(24),
    fontFamily: 'DMSansExtraBold',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: ms(-0.32, 0.3),
  },
  count: {
    fontSize: ms(18),
    fontFamily: 'DMSans-Regular',
    color: colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: vs(40),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  nftCard: {
    flex: 1,
    maxWidth: `${(100 - 2) / 2}%`,
  },
  // Skeleton styles
  skeletonGrid: {
    paddingTop: vs(8),
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  skeletonCard: {
    flex: 1,
    maxWidth: `${(100 - 2) / 2}%`,
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: vs(12) + vs(8) + ms(24) + vs(16), // handleContainer + title
    height: componentSizes.sheetFadeGradientHeight,
    zIndex: 1,
  },
});

export default NftSeeAllSheet;
