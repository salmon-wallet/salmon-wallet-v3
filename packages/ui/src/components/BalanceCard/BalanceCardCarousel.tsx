import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  gradients,
  showAmount,
  showPercentage,
  showAbsoluteChange,
  getLabelValue,
  hiddenValue,
  componentSizes,
  spacing,
} from '@salmon/shared';
import type { BalanceCardCarouselProps, BlockchainId } from './types';

// Import the SVG icons from Icon component
import { SolanaSvgIcon, BitcoinSvgIcon, EthereumSvgIcon } from '../Icon/SvgIcons';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Gradient colors for each blockchain
const BLOCKCHAIN_GRADIENTS: Record<BlockchainId, readonly [string, string, string]> = {
  solana: gradients.balanceCardSolana.colors,
  bitcoin: gradients.balanceCardBitcoin.colors,
  ethereum: gradients.balanceCardEthereum.colors,
};

/**
 * BalanceCardCarousel - Fixed container carousel with sliding content
 *
 * Features:
 * - Card container stays FIXED (doesn't move)
 * - Gradient color transitions between blockchains
 * - Only the CONTENT (logo, balance, change%) slides left/right
 * - Uses PanGestureHandler + Reanimated for smooth animations
 *
 * @example
 * ```tsx
 * <BalanceCardCarousel
 *   blockchains={[
 *     { network: { id: 'solana', name: 'Solana', blockchain: 'solana' }, usdTotal: 1000 },
 *     { network: { id: 'bitcoin', name: 'Bitcoin', blockchain: 'bitcoin' }, usdTotal: 500 },
 *   ]}
 *   hiddenBalance={false}
 *   onBlockchainChange={(blockchain, index) => console.log(blockchain)}
 * />
 * ```
 */
export const BalanceCardCarousel: React.FC<BalanceCardCarouselProps> = ({
  blockchains,
  hiddenBalance = false,
  onToggleVisibility,
  onBlockchainChange,
  activeIndex: controlledIndex,
  style,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  const [internalIndex, setInternalIndex] = React.useState(0);
  const activeIndex = controlledIndex ?? internalIndex;

  // Calculate offsets for header overlap effect
  const safeAreaTop = Platform.OS === 'web' ? 0 : insets.top;
  // Card starts at safe area (same as header), not at device top
  const cardMarginTop = safeAreaTop;
  // Content padding pushes content below the header's inner container
  const contentPaddingTop = componentSizes.headerInnerHeight + spacing.md;

  const translateX = useSharedValue(0);

  const updateIndex = useCallback(
    (newIndex: number) => {
      setInternalIndex(newIndex);
      const blockchain = blockchains[newIndex];
      onBlockchainChange?.(blockchain.network.blockchain, newIndex);
    },
    [blockchains, onBlockchainChange]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldSwipeLeft =
        event.translationX < -SWIPE_THRESHOLD && activeIndex < blockchains.length - 1;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD && activeIndex > 0;

      if (shouldSwipeLeft) {
        runOnJS(updateIndex)(activeIndex + 1);
      } else if (shouldSwipeRight) {
        runOnJS(updateIndex)(activeIndex - 1);
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  // Animated style for content sliding
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Get current blockchain data
  const currentBlockchain = blockchains[activeIndex];
  const currentGradient = BLOCKCHAIN_GRADIENTS[currentBlockchain?.network.blockchain || 'solana'];

  // Format values
  const { usdTotal, changePercent = 0, changeAmount = 0 } = currentBlockchain || {};
  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];

  // Render blockchain logo
  const renderLogo = (blockchain: BlockchainId, size: number = 42) => {
    switch (blockchain) {
      case 'solana':
        return <SolanaSvgIcon size={size} color="#FFFFFF" />;
      case 'bitcoin':
        return <BitcoinSvgIcon size={size} color="#FFFFFF" />;
      case 'ethereum':
        return <EthereumSvgIcon size={size} color="#FFFFFF" />;
      default:
        return <SolanaSvgIcon size={size} color="#FFFFFF" />;
    }
  };

  // Render balance with decimal opacity
  const renderBalance = () => {
    if (hiddenBalance) {
      return <Text style={styles.balance}>{hiddenValue}</Text>;
    }
    const formatted = showAmount(usdTotal);
    const dotIndex = formatted.lastIndexOf('.');
    if (dotIndex === -1) {
      return <Text style={styles.balance}>{formatted}</Text>;
    }
    const integerPart = formatted.substring(0, dotIndex);
    const decimalPart = formatted.substring(dotIndex);
    return (
      <View style={styles.balanceRow}>
        <Text style={styles.balance}>{integerPart}</Text>
        <Text style={[styles.balance, styles.balanceDecimals]}>{decimalPart}</Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={[styles.container, { marginTop: cardMarginTop }, style]} testID={testID}>
      <LinearGradient
        colors={[...currentGradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradient, { paddingTop: contentPaddingTop }]}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.content, animatedContentStyle]}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              {renderLogo(currentBlockchain?.network.blockchain || 'solana', 42)}
            </View>

            {/* Balance with eye icon */}
            <View style={styles.balanceContainer}>
              {renderBalance()}
              <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
                <Ionicons
                  name={hiddenBalance ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            {/* Change percentage */}
            {!hiddenBalance && (
              <View style={styles.changeRow}>
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {showPercentage(changePercent)}
                </Text>
                <Ionicons
                  name={changePercent >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={changeColor}
                  style={styles.changeArrow}
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  ({showAbsoluteChange(changeAmount)})
                </Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Pagination dots INSIDE the card */}
        {blockchains.length > 1 && (
          <View style={styles.pagination}>
            {blockchains.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gradient: {
    borderRadius: 35,
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1.38,
    borderBottomColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 42,
    height: 42,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balance: {
    fontSize: 50,
    fontWeight: '600',
    color: '#e0e0e0',
    letterSpacing: -0.25,
  },
  balanceDecimals: {
    opacity: 0.4,
    color: '#ffffff',
  },
  eyeButton: {
    marginLeft: 12,
    padding: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  changeText: {
    fontSize: 17,
    fontWeight: '500',
  },
  changeArrow: {
    marginHorizontal: 4,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.step.inactive,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
});

export default BalanceCardCarousel;
