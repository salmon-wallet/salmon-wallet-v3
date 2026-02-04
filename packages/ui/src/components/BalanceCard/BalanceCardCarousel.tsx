import {
  colors,
  componentSizes,
  getLabelValue,
  gradients,
  hiddenValue,
  ms,
  s,
  showAbsoluteChange,
  showAmount,
  showPercentage,
  spacing,
  vs,
} from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BalanceCardCarouselProps, BlockchainId } from './types';

// Import the SVG icons from Icon component
import { Ionicons } from '@expo/vector-icons';
import { BitcoinSvgIcon, EthereumSvgIcon, SolanaSvgIcon } from '../Icon/SvgIcons';
import { ScalesBackground } from '../ScalesBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Professional smooth timing config (like Revolut) - zero bounce
const SMOOTH_TIMING_CONFIG = {
  duration: 350,
  easing: Easing.out(Easing.cubic),
};

// Gradient colors for each blockchain
const BLOCKCHAIN_GRADIENTS: Record<BlockchainId, readonly [string, string, string]> = {
  solana: gradients.balanceCardSolana.colors,
  bitcoin: gradients.balanceCardBitcoin.colors,
  ethereum: gradients.balanceCardEthereum.colors,
};

// ScalesBackground stroke colors for each blockchain (15% opacity)
const BLOCKCHAIN_SCALES_COLORS: Record<BlockchainId, string> = {
  solana: 'rgba(153, 69, 255, 0.15)',   // Solana purple (#9945FF)
  bitcoin: 'rgba(247, 147, 26, 0.15)',   // Bitcoin orange (#F7931A)
  ethereum: 'rgba(98, 126, 234, 0.15)',  // Ethereum blue (#627EEA)
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
  const isAnimating = useSharedValue(false);

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
      if (isAnimating.value) return;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (isAnimating.value) return;
      const shouldSwipeLeft =
        event.translationX < -SWIPE_THRESHOLD && activeIndex < blockchains.length - 1;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD && activeIndex > 0;

      if (shouldSwipeLeft) {
        // Swipe left → animate current content OFF to the left
        isAnimating.value = true;
        translateX.value = withTiming(
          -SCREEN_WIDTH,
          { duration: 200 },
          (finished) => {
            if (finished) {
              // Update index (loads new content)
              runOnJS(updateIndex)(activeIndex + 1);
              // Position new content OFF to the right
              translateX.value = SCREEN_WIDTH;
              // Animate new content IN from the right
              translateX.value = withTiming(
                0,
                SMOOTH_TIMING_CONFIG,
                (timingFinished) => {
                  if (timingFinished) {
                    isAnimating.value = false;
                  }
                }
              );
            }
          }
        );
      } else if (shouldSwipeRight) {
        // Swipe right → animate current content OFF to the right
        isAnimating.value = true;
        translateX.value = withTiming(
          SCREEN_WIDTH,
          { duration: 200 },
          (finished) => {
            if (finished) {
              // Update index (loads new content)
              runOnJS(updateIndex)(activeIndex - 1);
              // Position new content OFF to the left
              translateX.value = -SCREEN_WIDTH;
              // Animate new content IN from the left
              translateX.value = withTiming(
                0,
                SMOOTH_TIMING_CONFIG,
                (timingFinished) => {
                  if (timingFinished) {
                    isAnimating.value = false;
                  }
                }
              );
            }
          }
        );
      } else {
        // Not enough swipe distance → smooth return to center (no bounce)
        isAnimating.value = true;
        translateX.value = withTiming(
          0,
          SMOOTH_TIMING_CONFIG,
          (finished) => {
            if (finished) {
              isAnimating.value = false;
            }
          }
        );
      }
    });

  // Animated style for content sliding
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Get current blockchain data
  const currentBlockchain = blockchains[activeIndex];
  const currentBlockchainId = currentBlockchain?.network.blockchain || 'solana';
  const currentGradient = BLOCKCHAIN_GRADIENTS[currentBlockchainId];
  const currentScalesColor = BLOCKCHAIN_SCALES_COLORS[currentBlockchainId];

  // Format values
  const { usdTotal, changePercent = 0, changeAmount = 0 } = currentBlockchain || {};
  const labelType = getLabelValue(changePercent);
  const changeColor = colors.change[labelType];

  // Render blockchain logo
  const renderLogo = (blockchain: BlockchainId) => {
    const iconSize = s(45);
    switch (blockchain) {
      case 'solana':
        return <SolanaSvgIcon size={iconSize} color="#FFFFFF" />;
      case 'bitcoin':
        return <BitcoinSvgIcon size={iconSize} color="#FFFFFF" />;
      case 'ethereum':
        return <EthereumSvgIcon size={iconSize} color="#FFFFFF" />;
      default:
        return <SolanaSvgIcon size={iconSize} color="#FFFFFF" />;
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
        {/* Scales pattern overlay - color based on current blockchain */}
        <ScalesBackground
          strokeColor={currentScalesColor}
          strokeWidth={1}
          patternHeight={26}
          style={styles.scalesOverlay}
        />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.content, animatedContentStyle]}>
            {/* Logo - Figma: 32x29px */}
            <View style={styles.logoContainer}>
              {renderLogo(currentBlockchain?.network.blockchain || 'solana')}
            </View>

            {/* Balance with eye icon */}
            <View style={styles.balanceContainer}>
              {renderBalance()}
              <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
                <Ionicons
                  name={hiddenBalance ? 'eye-off' : 'eye'}
                  size={ms(20)}
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
                  size={ms(15)}
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
    borderRadius: ms(26),
    paddingHorizontal: s(24),
    paddingBottom: vs(24),
    // Shadow - Figma: 0px 7.469px 14.938px 1.494px rgba(0,0,0,0.9)
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 7.5 },
        shadowOpacity: 0.9,
        shadowRadius: 15,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  content: {
    alignItems: 'center',
    gap: vs(8),
  },
  // Container for blockchain logos
  logoContainer: {
    width: s(35),
    height: vs(35),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(12),
    // Shadow: 0px 2.987px 17.925px black
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  balance: {
    fontSize: ms(60),
    fontWeight: '600',
    color: '#e0e0e0',
    letterSpacing: -0.245,
  },
  balanceDecimals: {
    opacity: 0.4,
    color: '#ffffff',
  },
  eyeButton: {
    padding: s(4),
  },
  // Figma: shadow 0px 2.987px 17.925px black (node 1697:3536)
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // Figma: 12.907px, Medium, tracking 0.1291, lineHeight 1.3 (node 1697:3537)
  changeText: {
    fontSize: ms(13),
    fontWeight: '500',
    letterSpacing: 0.13,
    lineHeight: ms(13 * 1.3),
  },
  changeArrow: {
    marginHorizontal: s(2),
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(42),
  },
  dot: {
    width: s(4),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: colors.step.inactive,
    marginHorizontal: s(3),
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
  scalesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ms(26),
    overflow: 'hidden',
  },
});

export default BalanceCardCarousel;
