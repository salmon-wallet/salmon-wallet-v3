import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  BackHandler,
  Image,
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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  gradients,
  shadows,
  borderRadius,
  borderWidth,
  componentSizes,
  ms,
  vs,
  s,
} from '@salmon/shared';
import { CallMadeSvgIcon } from '../Icon/SvgIcons';
import { BlurContainer } from '../BlurContainer';
import { ScalesBackground } from '../ScalesBackground';
import type { NftDetailSheetProps, NftAttribute } from './types';

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

export const NftDetailSheet: React.FC<NftDetailSheetProps> = ({
  visible,
  onClose,
  nft,
  onSendPress,
  onBurnPress,
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

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Render single attribute item
  const renderAttribute = useCallback((attribute: NftAttribute, index: number) => {
    return (
      <View key={`${attribute.trait_type}-${index}`} style={styles.attributeItem}>
        <Text style={styles.attributeName}>{attribute.trait_type}</Text>
        <Text style={styles.attributeValue}>{attribute.value}</Text>
      </View>
    );
  }, []);

  if (!visible || !nft) {
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

              {/* NFT Name */}
              <Text style={styles.nftName} numberOfLines={2}>
                {nft.name}
              </Text>
            </ReanimatedAnimated.View>
          </GestureDetector>

          {/* ScrollView Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* NFT Image */}
            {nft.image && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: nft.image }}
                  style={styles.nftImage}
                  resizeMode="cover"
                />
              </View>
            )}

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
    maxHeight: '90%',
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
  nftName: {
    fontSize: ms(24),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(16),
    paddingHorizontal: s(18),
    letterSpacing: ms(-0.32, 0.3),
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
  topFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: vs(12) + vs(8) + ms(24) + vs(16), // handleContainer + nftName
    height: componentSizes.sheetFadeGradientHeight,
    zIndex: 1,
  },
});

export default NftDetailSheet;
