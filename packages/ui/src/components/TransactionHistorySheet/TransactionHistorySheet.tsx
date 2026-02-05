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
  Dimensions,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, ms, vs, s, spacing, fontSize } from '@salmon/shared';

import { ScalesBackground } from '../ScalesBackground';
import { TransactionItem } from './TransactionItem';
import type { TransactionHistorySheetProps, Transaction } from './types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
  extraBold: 'DMSansExtraBold',
} as const;

// ============================================================================
// Skeleton Components
// ============================================================================

/**
 * Skeleton loader for a single transaction item
 */
const TransactionItemSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      <ContentLoader
        speed={1.5}
        width="100%"
        height={68}
        backgroundColor={colors.skeleton.base}
        foregroundColor={colors.skeleton.highlight}
      >
        {/* Token logo */}
        <Rect x="16" y="18" rx="16" ry="16" width="32" height="32" />
        {/* Type label */}
        <Rect x="60" y="18" rx="4" ry="4" width="80" height="14" />
        {/* Description */}
        <Rect x="60" y="38" rx="4" ry="4" width="100" height="12" />
        {/* Amount (right side) */}
        <Rect x="80%" y="18" rx="4" ry="4" width="20%" height="14" />
        {/* Time (right side) */}
        <Rect x="85%" y="38" rx="4" ry="4" width="15%" height="12" />
      </ContentLoader>
    </View>
  );
};

/**
 * Skeleton loader for multiple transaction items
 */
const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <TransactionItemSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

/**
 * Empty state when no transactions
 */
const EmptyState: React.FC = () => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptySubtitle}>
        Your transaction history will appear here
      </Text>
    </View>
  );
};

/**
 * Error state with retry option
 */
const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Failed to load transactions</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableWithoutFeedback onPress={onRetry}>
          <View style={styles.retryButton}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * TransactionHistorySheet - Bottom sheet modal for transaction history
 *
 * Features:
 * - Slide-up animation from bottom
 * - Drag to dismiss
 * - Paginated transaction list with infinite scroll
 * - Loading skeletons
 * - Empty and error states
 *
 * @example
 * ```tsx
 * <TransactionHistorySheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   transactions={transactions}
 *   loading={loading}
 *   hasMore={hasMore}
 *   onLoadMore={loadMore}
 * />
 * ```
 */
export const TransactionHistorySheet: React.FC<TransactionHistorySheetProps> = ({
  visible,
  onClose,
  transactions,
  loading = false,
  loadingMore = false,
  onLoadMore,
  hasMore = false,
  hiddenBalance = false,
  onTransactionPress,
  error = null,
  onRetry,
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

  // Handle transaction press
  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      onTransactionPress?.(transaction);
    },
    [onTransactionPress]
  );

  // Handle scroll to show/hide top fade gradient dynamically
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(offsetY / 30, 1);
    topFadeOpacity.setValue(opacity);
  }, [topFadeOpacity]);

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [loadingMore, hasMore, onLoadMore]);

  // Render individual transaction item
  const renderTransaction = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        transaction={item}
        onPress={handleTransactionPress}
        hiddenBalance={hiddenBalance}
      />
    ),
    [handleTransactionPress, hiddenBalance]
  );

  // Render footer (loading more indicator)
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  }, [loadingMore]);

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
            <ReanimatedAnimated.View style={[styles.backdrop, backdropAnimatedStyle]} />
          </TouchableWithoutFeedback>

          {/* Sheet Container */}
          <ReanimatedAnimated.View style={[styles.sheetContainer, sheetAnimatedStyle, style]}>
            {/* Scales Background */}
            <ScalesBackground />

            {/* Draggable Header Area */}
            <GestureDetector gesture={panGesture}>
              <ReanimatedAnimated.View style={styles.dragArea}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Transaction History</Text>
              </ReanimatedAnimated.View>
            </GestureDetector>

            {/* Content */}
            <View style={styles.content}>
              {/* Error State */}
              {error && !loading && (
                <ErrorState message={error} onRetry={onRetry} />
              )}

              {/* Loading State */}
              {loading && !error && (
                <TransactionListSkeleton count={6} />
              )}

              {/* Empty State */}
              {!loading && !error && transactions.length === 0 && (
                <EmptyState />
              )}

              {/* Transaction List */}
              {!loading && !error && transactions.length > 0 && (
                <FlatList
                  data={transactions}
                  renderItem={renderTransaction}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onEndReached={handleEndReached}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                />
              )}
            </View>

            {/* Top fade gradient */}
            <Animated.View
              style={[styles.topFadeGradient, { opacity: topFadeOpacity }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['#161c2d', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </ReanimatedAnimated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

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
    minHeight: '70%',
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
    fontFamily: FONT_FAMILY.extraBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vs(15),
    letterSpacing: ms(-0.12, 0.3),
  },
  content: {
    flex: 1,
    paddingHorizontal: s(18),
  },
  listContent: {
    paddingBottom: vs(30),
  },
  // Skeleton styles
  skeletonList: {
    paddingTop: vs(8),
  },
  skeletonContainer: {
    backgroundColor: colors.background.tokenItem,
    borderRadius: 12,
    marginBottom: vs(8),
    overflow: 'hidden',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(60),
  },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  emptySubtitle: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(60),
  },
  errorTitle: {
    fontSize: ms(18),
    fontFamily: FONT_FAMILY.medium,
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  errorMessage: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: vs(16),
  },
  retryButton: {
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.medium,
    color: '#FFFFFF',
  },
  // Loading more
  loadingMoreContainer: {
    paddingVertical: vs(16),
    alignItems: 'center',
  },
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: vs(12) + vs(8) + ms(24) + vs(15), // handleContainer + title
    height: 30,
    zIndex: 1,
  },
});

export default TransactionHistorySheet;
