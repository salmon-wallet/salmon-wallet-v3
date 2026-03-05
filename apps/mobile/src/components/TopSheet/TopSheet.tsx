/**
 * TopSheet - Slide-down modal component from the top of the screen
 *
 * This component provides a sheet/modal that slides down from the top of the screen,
 * similar to a reverse bottom sheet or a notification shade pattern.
 *
 * Features:
 * - Smooth slide-down animation using react-native-reanimated
 * - Darkened backdrop with configurable opacity
 * - Tap-to-dismiss backdrop (configurable)
 * - Optional header with title and close button
 * - Visual drag handle indicator
 * - Respects safe area insets
 * - Android back button handling
 *
 * Animation:
 * - Open: translateY from -sheetHeight to 0 (slide down into view)
 * - Close: translateY from 0 to -sheetHeight (slide up out of view)
 * - Backdrop: opacity from 0 to backdropOpacity (default 0.5)
 * - Duration: 300ms with cubic easing
 *
 * Usage:
 * ```tsx
 * <TopSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   title="Settings"
 * >
 *   <SettingsOptions />
 * </TopSheet>
 * ```
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  fontFamilyNative,
  shadows,
  spacing,
  borderRadius,
  fontSize,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';

import type { TopSheetProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ANIMATION_DURATION = 300;
const DEFAULT_BACKDROP_OPACITY = 0.5;
const DEFAULT_MAX_HEIGHT_PERCENTAGE = 0.7;

// ============================================================================
// Component
// ============================================================================

export function TopSheet({
  visible,
  onClose,
  children,
  title,
  style,
  contentStyle,
  showHandle = true,
  closeOnBackdropPress = true,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  backdropOpacity = DEFAULT_BACKDROP_OPACITY,
  fullHeight = false,
  maxHeightPercentage = DEFAULT_MAX_HEIGHT_PERCENTAGE,
  testID,
  onOpenComplete,
  onCloseComplete,
}: TopSheetProps): React.ReactElement | null {
  // Get screen dimensions reactively
  const { height: screenHeight } = useWindowDimensions();

  // Internal visibility state (for unmounting after animation)
  const [isRendered, setIsRendered] = useState(visible);

  // Calculate sheet height
  const maxSheetHeight = fullHeight
    ? screenHeight
    : screenHeight * maxHeightPercentage;

  // Animation shared values
  const translateY = useSharedValue(visible ? 0 : -maxSheetHeight);
  const backdropOpacityValue = useSharedValue(visible ? backdropOpacity : 0);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Opening - make visible first, then animate
      setIsRendered(true);
      translateY.value = -maxSheetHeight;

      // Animate to visible position
      translateY.value = withTiming(
        0,
        {
          duration: animationDuration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished && onOpenComplete) {
            runOnJS(onOpenComplete)();
          }
        }
      );

      // Fade in backdrop
      backdropOpacityValue.value = withTiming(backdropOpacity, {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      });
    } else if (isRendered) {
      // Closing - animate out, then unmount
      translateY.value = withTiming(
        -maxSheetHeight,
        {
          duration: animationDuration,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setIsRendered)(false);
            if (onCloseComplete) {
              runOnJS(onCloseComplete)();
            }
          }
        }
      );

      // Fade out backdrop
      backdropOpacityValue.value = withTiming(0, {
        duration: animationDuration,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [
    visible,
    maxSheetHeight,
    animationDuration,
    backdropOpacity,
    isRendered,
    onOpenComplete,
    onCloseComplete,
    backdropOpacityValue,
    translateY,
  ]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true; // Prevent default back behavior
      }
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    if (closeOnBackdropPress) {
      onClose();
    }
  }, [closeOnBackdropPress, onClose]);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }));

  // Don't render if not visible and not rendered
  if (!isRendered) {
    return null;
  }

  return (
    <View style={styles.overlay} testID={testID}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
      </TouchableWithoutFeedback>

      {/* Sheet Container */}
      <Animated.View
        style={[
          styles.sheetContainer,
          { maxHeight: maxSheetHeight },
          sheetAnimatedStyle,
        ]}
      >
        <SafeAreaView
          style={[styles.sheet, style]}
          edges={['top']}
        >
          {/* Scales Background */}
          <ScalesBackground />

          {/* Header (optional) */}
          {title && (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close sheet"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <View style={[styles.content, contentStyle]}>
            {children}
          </View>

          {/* Handle indicator (bottom of sheet) */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-start',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dialog.overlay,
  },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.topSheet,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginLeft: spacing['4xl'], // Offset for close button centering
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.iconLg,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.scrollbar,
    backgroundColor: colors.border.default,
  },
});

export default TopSheet;
