import { ms, s, vs } from '@salmon/shared';
import React, { useCallback, useEffect } from 'react';
import {
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ContentCopySvgIcon } from '../Icon/SvgIcons';
import QRCode from '../QRCode';
import { ScalesBackground } from '../ScalesBackground';
import type { ReceiveSheetProps } from './types';

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

// Layout constants
const CONTENT_PADDING_HORIZONTAL = 24;
const QR_BORDER_WIDTH = 24;

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
  const { width: screenWidth } = useWindowDimensions();

  // Calculate QR size: full width minus padding and border
  const qrSize = screenWidth - (CONTENT_PADDING_HORIZONTAL * 2) - (QR_BORDER_WIDTH * 2);

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

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle copy press
  const handleCopyPress = useCallback(() => {
    onCopy?.();
  }, [onCopy]);

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

            {/* Draggable Header Area */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.dragArea}>
                {/* Drag Handle */}
                <View style={styles.handleContainer}>
                  <View style={styles.handle} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Receive</Text>
              </Animated.View>
            </GestureDetector>

            {/* Content */}
            <View style={styles.content}>
              {/* QR Code Container */}
              <View style={styles.qrContainer}>
                <QRCode
                  value={address}
                  size={qrSize}
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
  dragArea: {
    // This area is draggable
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
    paddingHorizontal: s(CONTENT_PADDING_HORIZONTAL),
    paddingBottom: vs(40),
    gap: vs(42),
  },
  qrContainer: {
    borderRadius: ms(16),
    borderWidth: QR_BORDER_WIDTH,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: vs(18),
  },
  address: {
    fontSize: ms(14),
    fontFamily: FONT_FAMILY.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.14,
    lineHeight: ms(14 * 1.3),
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
