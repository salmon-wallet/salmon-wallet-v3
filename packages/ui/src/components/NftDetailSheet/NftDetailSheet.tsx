import React, { useCallback, useEffect } from 'react';
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, ms, vs, s } from '@salmon/shared';
import { CallMadeSvgIcon } from '../Icon/SvgIcons';
import { GlassContainer } from '../GlassContainer';
import type { NftDetailSheetProps, NftAttribute, NftDetailData } from './types';

// Animation constants
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;

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

/**
 * NftDetailSheet - Bottom sheet modal for NFT details
 *
 * Features:
 * - Slide-up animation from bottom
 * - Rounded top corners with border (35px radius)
 * - Drag handle indicator
 * - Large NFT image with shadow
 * - Description section with glass effect
 * - Attributes grid with 2 columns
 * - Send and Burn action buttons
 * - Backdrop with tap-to-dismiss
 *
 * @example
 * ```tsx
 * <NftDetailSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   nft={selectedNft}
 *   onSendPress={() => handleSend(selectedNft)}
 *   onBurnPress={() => handleBurn(selectedNft)}
 * />
 * ```
 */
export const NftDetailSheet: React.FC<NftDetailSheetProps> = ({
  visible,
  onClose,
  nft,
  onSendPress,
  onBurnPress,
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

  // Handle send press
  const handleSendPress = useCallback(() => {
    onSendPress?.();
  }, [onSendPress]);

  // Handle burn press
  const handleBurnPress = useCallback(() => {
    onBurnPress?.();
  }, [onBurnPress]);

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet Container */}
        <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle, style]}>
          {/* Texture overlay */}
          <View style={styles.textureOverlay} />

          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* NFT Name */}
          <Text style={styles.nftName} numberOfLines={2}>
            {nft.name}
          </Text>

          {/* ScrollView Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
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
              <GlassContainer
                style={styles.secondaryButtonWrapper}
                fallbackBlurIntensity={2.5}
                fallbackBackgroundColor="rgba(255, 255, 255, 0.04)"
                fallbackBorderColor="rgba(255, 92, 69, 0.8)"
                fallbackBorderWidth={0.5}
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
              </GlassContainer>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderTopWidth: 1,
    borderTopColor: '#404962',
    maxHeight: '90%',
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
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    opacity: 0.4,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  handle: {
    width: s(70),
    height: vs(6),
    borderRadius: 100,
    backgroundColor: '#b9b9b9',
    opacity: 0.4,
  },
  nftName: {
    fontSize: ms(24),
    fontFamily: FONT_FAMILY.extraBold,
    color: '#FFFFFF',
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
    // Shadow for image
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
    borderColor: '#404962',
    overflow: 'hidden',
    backgroundColor: 'rgba(56, 63, 82, 0.1)',
  },
  sectionContent: {
    padding: s(7),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
});

export default NftDetailSheet;
