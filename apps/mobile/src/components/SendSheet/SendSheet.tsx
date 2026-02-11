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
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  shadows,
  borderRadius,
  borderWidth,
  componentSizes,
  ms,
  vs,
  s,
  useSendTransaction,
} from '@salmon/shared';
import { ScalesBackground } from '../ScalesBackground';
import { StepTokenSelect } from './StepTokenSelect';
import { StepAddressAmount } from './StepAddressAmount';
import { StepConfirmation } from './StepConfirmation';
import type { SendSheetProps, SendStep, SendToken } from './types';

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
// Component
// ============================================================================

export const SendSheet: React.FC<SendSheetProps> = ({
  visible,
  onClose,
  tokens,
  blockchain,
  account,
  onSuccess,
  showUnverifiedTokens,
  style,
}) => {
  // Bitcoin has only one token (BTC), so skip token selection
  const skipTokenSelect = blockchain === 'bitcoin';

  // Step management
  const [step, setStep] = useState<SendStep>(skipTokenSelect ? 'address-amount' : 'token-select');
  const [selectedToken, setSelectedToken] = useState<SendToken | null>(
    skipTokenSelect && tokens.length > 0 ? tokens[0] : null
  );
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Send hook
  const sendHook = useSendTransaction({ account, blockchain });

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Close handler for worklet
  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle close with state reset
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      if (skipTokenSelect && tokens.length > 0) {
        setStep('address-amount');
        setSelectedToken(tokens[0]);
      } else {
        setStep('token-select');
        setSelectedToken(null);
      }
      setRecipientAddress('');
      setAmount('');
      sendHook.reset();
    }, ANIMATION_DURATION);
  }, [onClose, sendHook, skipTokenSelect, tokens]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      dragY.value = 0;
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(BACKDROP_OPACITY, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
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
        if (step === 'confirmation') {
          setStep('address-amount');
        } else if (step === 'address-amount' && !skipTokenSelect) {
          setStep('token-select');
        } else {
          handleClose();
        }
        return true;
      }
    );

    return () => backHandler.remove();
  }, [visible, step, skipTokenSelect, handleClose]);

  // Pan gesture for dragging the sheet
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        dragY.value = event.translationY;
        backdropOpacity.value = interpolate(
          event.translationY,
          [0, SCREEN_HEIGHT * 0.5],
          [BACKDROP_OPACITY, 0]
        );
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      if (event.translationY > DRAG_THRESHOLD || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeSheet)();
      } else {
        dragY.value = withSpring(0, SPRING_CONFIG);
        backdropOpacity.value = withSpring(BACKDROP_OPACITY, SPRING_CONFIG);
      }
    });

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Step navigation handlers
  const handleSelectToken = useCallback((token: SendToken) => {
    setSelectedToken(token);
    setStep('address-amount');
  }, []);

  const handleBackToTokenSelect = useCallback(() => {
    setStep('token-select');
  }, []);

  const handleReview = useCallback((address: string, amt: string) => {
    setRecipientAddress(address);
    setAmount(amt);
    setStep('confirmation');
  }, []);

  const handleBackToAddressAmount = useCallback(() => {
    setStep('address-amount');
    sendHook.reset();
  }, [sendHook]);

  const handleSuccess = useCallback((txId: string) => {
    onSuccess?.(txId);
    handleClose();
  }, [onSuccess, handleClose]);

  // Back button handler
  const handleBackPress = useCallback(() => {
    if (step === 'confirmation') {
      handleBackToAddressAmount();
    } else if (step === 'address-amount') {
      if (skipTokenSelect) {
        handleClose();
      } else {
        handleBackToTokenSelect();
      }
    }
  }, [step, skipTokenSelect, handleBackToAddressAmount, handleBackToTokenSelect, handleClose]);

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

  const showBackButton = step !== 'token-select' || skipTokenSelect;
  const title = 'Send';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
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

                {/* Title Row with Back Button */}
                <View style={styles.titleRow}>
                  {showBackButton && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackPress}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={ms(24)}
                        color={colors.text.primary}
                      />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.title}>{title}</Text>
                  {/* Spacer to keep title centered when back button is shown */}
                  {showBackButton && <View style={styles.backButtonSpacer} />}
                </View>
              </ReanimatedAnimated.View>
            </GestureDetector>

            {/* Content */}
            <View style={styles.content}>
              {step === 'token-select' && (
                <StepTokenSelect
                  tokens={tokens}
                  onSelectToken={handleSelectToken}
                  showUnverifiedTokens={showUnverifiedTokens}
                />
              )}

              {step === 'address-amount' && selectedToken && (
                <StepAddressAmount
                  token={selectedToken}
                  blockchain={blockchain}
                  account={account}
                  onBack={handleBackToTokenSelect}
                  onReview={handleReview}
                  onCancel={handleClose}
                />
              )}

              {step === 'confirmation' && selectedToken && (
                <StepConfirmation
                  token={selectedToken}
                  recipientAddress={recipientAddress}
                  amount={amount}
                  blockchain={blockchain}
                  account={account}
                  onBack={handleBackToAddressAmount}
                  onCancel={handleClose}
                  onSuccess={handleSuccess}
                />
              )}
            </View>
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
    backgroundColor: colors.sheet.backdrop,
  },
  sheetContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
    borderTopWidth: borderWidth.sheet,
    borderTopColor: colors.border.default,
    minHeight: '70%',
    maxHeight: '92%',
    ...shadows.sheet,
  },
  dragArea: {},
  handleContainer: {
    alignItems: 'center',
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  handle: {
    width: s(componentSizes.sheetHandleWidth),
    height: vs(componentSizes.sheetHandleHeight),
    borderRadius: 75,
    backgroundColor: colors.sheet.handle,
    opacity: componentSizes.sheetHandleOpacity,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(18),
    marginBottom: vs(15),
  },
  backButton: {
    position: 'absolute',
    left: s(18),
    zIndex: 1,
  },
  backButtonSpacer: {
    width: ms(24),
  },
  title: {
    fontSize: ms(24),
    fontFamily: FONT_FAMILY.extraBold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: ms(-0.12, 0.3),
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SendSheet;
