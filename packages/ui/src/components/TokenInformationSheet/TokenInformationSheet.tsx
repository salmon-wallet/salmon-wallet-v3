import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Platform,
  BackHandler,
  Dimensions,
} from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, ms, vs, s } from '@salmon/shared';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { TokenListItem } from '../TokenList';
import { PriceChart } from '../PriceChart';
import { TokenMarketData } from '../TokenMarketData';
import { TokenAbout } from '../TokenAbout';
import { TokenBadgesSection } from './TokenBadgesSection';
import type { TokenInformationSheetProps } from './types';

// Animation constants
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150; // Pixels to drag before closing
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

/**
 * TokenListItem skeleton for loading state
 */
const TokenListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.tokenItemSkeletonContainer}>
      <ContentLoader
        speed={1.5}
        width="100%"
        height={60}
        backgroundColor={colors.skeleton.base}
        foregroundColor={colors.skeleton.highlight}
      >
        {/* Logo circle */}
        <Rect x="12" y="12" rx="18" ry="18" width="36" height="36" />
        {/* Token name */}
        <Rect x="60" y="12" rx="4" ry="4" width="100" height="14" />
        {/* Price info */}
        <Rect x="60" y="34" rx="4" ry="4" width="80" height="12" />
        {/* USD value (right side) */}
        <Rect x="85%" y="12" rx="4" ry="4" width="15%" height="16" />
        {/* Token amount (right side) */}
        <Rect x="85%" y="34" rx="4" ry="4" width="15%" height="12" />
      </ContentLoader>
    </View>
  );
};

/**
 * TokenInformationSheet - Bottom sheet modal for token details
 *
 * Features:
 * - Slide-up animation from bottom
 * - Rounded top corners with border
 * - Drag handle indicator
 * - Title header
 * - ScrollView with token information components
 * - Loading skeleton states
 * - Backdrop with tap-to-dismiss
 *
 * @example
 * ```tsx
 * <TokenInformationSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   token={selectedToken}
 *   chartData={priceData}
 *   chartPeriod="1D"
 *   onChartPeriodChange={setPeriod}
 *   coinInfo={coinInfo}
 *   marketData={marketData}
 *   loading={false}
 * />
 * ```
 */
export const TokenInformationSheet: React.FC<TokenInformationSheetProps> = ({
  visible,
  onClose,
  token,
  blockchain = 'solana',
  chartData,
  chartPeriod,
  onChartPeriodChange,
  coinInfo,
  marketData,
  loading = false,
  style,
}) => {
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

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle token press (no-op for display purposes)
  const handleTokenPress = useCallback(() => {
    // No action needed - token is already selected
  }, []);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

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
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet Container */}
        <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle, style]}>
          {/* Draggable Header Area */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.dragArea}>
              {/* Drag Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Title */}
              <Text style={styles.title}>Token Information</Text>
            </Animated.View>
          </GestureDetector>

          {/* ScrollView Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TokenListItem */}
            {loading ? (
              <TokenListItemSkeleton />
            ) : (
              <TokenListItem
                token={token}
                onPress={handleTokenPress}
                hiddenBalance={false}
                blockchain={blockchain}
                style={{ marginHorizontal: 0 }}
              />
            )}

            {/* PriceChart */}
            <PriceChart
              data={chartData}
              selectedPeriod={chartPeriod}
              onPeriodChange={onChartPeriodChange}
              loading={loading}
              style={{ marginHorizontal: 0 }}
            />

            {/* TokenMarketData (Info) */}
            <TokenMarketData
              data={marketData}
              symbol={token.symbol}
              title="Info"
              loading={loading}
              style={{ marginHorizontal: 0 }}
            />

            {/* TokenBadgesSection - Before About */}
            <TokenBadgesSection
              tags={token.tags}
              loading={loading}
              style={{ marginHorizontal: 0 }}
            />

            {/* TokenAbout - At the bottom */}
            <TokenAbout
              description={coinInfo?.description}
              loading={loading}
              style={{ marginHorizontal: 0 }}
            />
          </ScrollView>
        </Animated.View>
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
    backgroundColor: '#000000',
  },
  sheetContainer: {
    backgroundColor: '#161c2d',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 0.75,
    borderTopColor: '#404962',
    minHeight: '85%',
    maxHeight: '92%',
    // Shadow
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
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
    width: s(70),
    height: vs(6),
    borderRadius: 75,
    backgroundColor: '#b9b9b9',
    opacity: 0.4,
  },
  title: {
    fontSize: ms(24),
    fontFamily: 'DMSansExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vs(15),
    letterSpacing: ms(-0.12, 0.3),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: s(18),
    paddingBottom: vs(30),
    gap: vs(15),
  },
  tokenItemSkeletonContainer: {
    backgroundColor: colors.background.tokenItem,
    borderRadius: 12,
    marginBottom: vs(8),
    overflow: 'hidden',
  },
});

export default TokenInformationSheet;
