import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ms, vs, s } from '@salmon/shared';
import { ContentCopySvgIcon } from '../Icon/SvgIcons';
import { ScalesBackground } from '../ScalesBackground';
import QRCode from '../QRCode';
import type { ReceiveSheetProps } from './types';

// Animation constants
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;

// Font family constants
const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  semiBold: 'DMSansSemiBold',
  bold: 'DMSansBold',
  extraBold: 'DMSansExtraBold',
} as const;

/**
 * ReceiveSheet - Bottom sheet modal for receiving tokens
 *
 * Features:
 * - Slide-up animation from bottom
 * - Rounded top corners with border (26px radius)
 * - Drag handle indicator
 * - QR code for wallet address
 * - Full address display
 * - Copy address button
 * - Backdrop with tap-to-dismiss
 *
 * @example
 * ```tsx
 * <ReceiveSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   address="3NE4QmUT15PGZTPpqHjGH6VKUdXrpTKb82NGqYuQdXdL"
 *   onCopy={() => copyToClipboard(address)}
 * />
 * ```
 */
export const ReceiveSheet: React.FC<ReceiveSheetProps> = ({
  visible,
  onClose,
  address,
  onCopy,
  style,
}) => {
  // Animation shared values
  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
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
      translateY.value = withTiming(1000, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      // Fade out backdrop
      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, translateY, backdropOpacity]);

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

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle copy press
  const handleCopyPress = useCallback(() => {
    onCopy?.();
  }, [onCopy]);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
            {/* Scales Background */}
            <ScalesBackground />

            {/* Drag Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Receive</Text>

            {/* Content */}
            <View style={styles.content}>
              {/* QR Code Container */}
              <View style={styles.qrContainer}>
                <QRCode
                  value={address}
                  size={s(310)}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>

              {/* Address */}
              <Text style={styles.address} selectable>
                {address}
              </Text>

              {/* Copy Button */}
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Copy address"
              >
                <ContentCopySvgIcon size={ms(23)} color="#000000" />
                <Text style={styles.copyButtonText}>Copy address</Text>
              </TouchableOpacity>
            </View>
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
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    borderTopWidth: 0.75,
    borderTopColor: '#404962',
    overflow: 'hidden',
    // Shadow going up
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(9),
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
    letterSpacing: 0.24,
    lineHeight: ms(24 * 1.3),
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: s(18),
    paddingBottom: vs(40),
    gap: vs(42),
  },
  qrContainer: {
    borderRadius: ms(10),
    overflow: 'hidden',
    marginTop: vs(18),
  },
  address: {
    fontSize: ms(12.7),
    fontFamily: FONT_FAMILY.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.13,
    lineHeight: ms(12.7 * 1.3),
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcfcfc',
    borderRadius: ms(11),
    width: s(180),
    height: vs(42),
    gap: s(4),
  },
  copyButtonText: {
    fontSize: ms(15),
    fontFamily: FONT_FAMILY.extraBold,
    color: '#000000',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default ReceiveSheet;
