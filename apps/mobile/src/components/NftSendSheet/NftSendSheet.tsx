/**
 * NftSendSheet - Bottom sheet modal for sending an NFT
 *
 * Simple modal with:
 * - NFT preview (image + name)
 * - Address input with per-chain validation
 * - Confirm/Cancel buttons
 * - Loading/success/error states
 *
 * Supports Solana (SPL), Ethereum (ERC721/ERC1155).
 * Bitcoin ordinals show "not supported" message.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  colors,
  borderRadius,
  borderWidth,
  componentSizes,
  ms,
  vs,
  s,
  useNftTransfer,
  type NftData,
  type BlockchainAccount,
  fontFamilyNative,
  type BlockchainType,
  type ValidationCallbackResult,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { InputAddress } from '../InputAddress';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation constants (matching other sheets)
const ANIMATION_DURATION = 300;
const BACKDROP_OPACITY = 0.8;
const DRAG_THRESHOLD = 150;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// ============================================================================
// Types
// ============================================================================

export interface NftSendSheetProps {
  visible: boolean;
  onClose: () => void;
  nft: NftData | null;
  account: BlockchainAccount | undefined;
  onSuccess?: (txId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function NftSendSheet({
  visible,
  onClose,
  nft,
  account,
  onSuccess,
}: NftSendSheetProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [addressValid, setAddressValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendNft, reset: resetTransfer } = useNftTransfer({ account });

  const blockchain: BlockchainType = nft?.blockchain ?? 'solana';
  const isBitcoin = blockchain === 'bitcoin';

  // Animation
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (visible) {
      setAddress('');
      setAddressValid(false);
      setLoading(false);
      setError(null);
      resetTransfer();
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    }
  }, [visible, resetTransfer, translateY, backdropOpacity]);

  // Android back button
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  // Dismiss animation
  const dismiss = useCallback(() => {
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic) },
      () => runOnJS(onClose)(),
    );
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
  }, [onClose, translateY, backdropOpacity]);

  // Pan gesture for drag-to-dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DRAG_THRESHOLD) {
        translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, () =>
          runOnJS(onClose)(),
        );
        backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleValidation = useCallback((result: ValidationCallbackResult) => {
    setAddressValid(result.isValid);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!nft || !addressValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sendNft(nft, address);
      onSuccess?.(result.txId);
      dismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
      setLoading(false);
    }
  }, [nft, address, addressValid, loading, sendNft, onSuccess, dismiss]);

  const canConfirm = addressValid && !loading && !isBitcoin;

  if (!nft) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={styles.gestureRoot}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={dismiss}>
          <ReanimatedAnimated.View style={[styles.backdrop, backdropAnimatedStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <ReanimatedAnimated.View style={[styles.sheet, sheetAnimatedStyle]}>
            <ScalesBackground style={StyleSheet.absoluteFillObject} />

            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('nft.send.title', 'Send NFT')}</Text>

            {/* NFT Preview */}
            <View style={styles.nftPreview}>
              <Image
                source={nft.image ?? undefined}
                style={styles.nftImage}
                contentFit="cover"
                autoplay={true}
                recyclingKey={nft.mint}
                placeholder={undefined}
              />
              <View style={styles.nftInfo}>
                <Text style={styles.nftName} numberOfLines={1}>
                  {nft.name}
                </Text>
                {nft.collectionName && (
                  <Text style={styles.nftCollection} numberOfLines={1}>
                    {nft.collectionName}
                  </Text>
                )}
              </View>
            </View>

            {/* Content */}
            {isBitcoin ? (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>
                  {t('nft.send.ordinalsNotSupported', 'Ordinal transfers are not yet supported.')}
                </Text>
              </View>
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <Text style={styles.loadingText}>{t('nft.send.sending', 'Sending NFT...')}</Text>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <InputAddress
                  address={address}
                  onChange={setAddress}
                  onValidation={handleValidation}
                  placeholder={t('nft.send.enterRecipientAddress', 'Enter recipient address')}
                  label={t('token.send.recipient', 'Recipient')}
                />

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={dismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('actions.cancel', 'Cancel')}</Text>
              </TouchableOpacity>

              {!isBitcoin && (
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !canConfirm && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    !canConfirm && styles.confirmButtonTextDisabled,
                  ]}>
                    {loading ? t('nft.send.sending', 'Sending NFT...') : t('actions.send', 'Send')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ReanimatedAnimated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.sheet.backdrop,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
    borderTopWidth: borderWidth.sheet,
    borderLeftWidth: borderWidth.sheet,
    borderRightWidth: borderWidth.sheet,
    borderColor: colors.background.tertiary,
    overflow: 'hidden',
    paddingBottom: vs(34),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  handle: {
    width: componentSizes.sheetHandleWidth,
    height: componentSizes.sheetHandleHeight,
    borderRadius: componentSizes.sheetHandleHeight / 2,
    backgroundColor: `rgba(255, 255, 255, ${componentSizes.sheetHandleOpacity})`,
  },
  title: {
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(18),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(16),
  },
  nftPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    marginBottom: vs(20),
    gap: s(12),
  },
  nftImage: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(8),
    backgroundColor: colors.background.card,
  },
  nftInfo: {
    flex: 1,
  },
  nftName: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(16),
    fontWeight: '600',
    color: colors.text.primary,
  },
  nftCollection: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(12),
    color: colors.text.secondary,
    marginTop: vs(2),
  },
  inputContainer: {
    paddingHorizontal: s(20),
    marginBottom: vs(20),
  },
  messageContainer: {
    paddingHorizontal: s(20),
    paddingVertical: vs(24),
    alignItems: 'center',
  },
  messageText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: vs(24),
    alignItems: 'center',
    gap: vs(12),
  },
  loadingText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
  },
  errorText: {
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(12),
    color: colors.status.error,
    marginTop: vs(8),
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: s(20),
    gap: s(12),
  },
  cancelButton: {
    flex: 1,
    height: vs(48),
    borderRadius: ms(12),
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(15),
    fontWeight: '600',
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    height: vs(48),
    borderRadius: ms(12),
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.accent.tintHover,
  },
  confirmButtonText: {
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(15),
    fontWeight: '600',
    color: colors.text.primary,
  },
  confirmButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default NftSendSheet;
