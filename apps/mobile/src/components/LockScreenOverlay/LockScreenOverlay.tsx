/**
 * LockScreenOverlay - Animated lock screen overlay with slide animation
 *
 * UX Flow:
 * 1. If biometric is enabled + key stored → auto-prompt Face ID/Touch ID
 * 2. If biometric fails/cancelled → show password input as fallback
 * 3. If biometric not available → show password input directly
 *
 * Animation:
 * - Lock: translateY from -screenHeight to 0 (slide down into view)
 * - Unlock: translateY from 0 to -screenHeight (slide up out of view)
 * - Duration: 800ms with cubic easing
 */

import { Logo } from '@salmon/assets';
import {
  colors,
  fontFamilyNative,
  fontSize,
  gradients,
  letterSpacing,
  shadows,
  lineHeight,
  ms,
  s,
  spacing,
  vs,
  borderWidth,
  borderRadius,
  componentSizes,
} from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingScreen } from '../LoadingScreen';
import type { LockScreenOverlayProps } from './types';

// ============================================================================
// Types
// ============================================================================

const UNLOCK_ANIMATION_DURATION = 600;

// ============================================================================
// Component
// ============================================================================

export function LockScreenOverlay({
  locked,
  onUnlock,
  onUnlockWithKey,
  onRemoveAllAccounts,
  onAnimationComplete,
  biometric,
  headerHeight,
}: LockScreenOverlayProps) {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  // Extract biometric properties
  const biometricState = biometric?.state;
  const authenticateWithBiometric = biometric?.authenticateWithBiometric;
  const enableBiometric = biometric?.enableBiometric ?? false;
  const refreshBiometricState = biometric?.refreshState;

  // State
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(locked);

  // Whether to show the password fallback UI (hidden when biometric is primary)
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);

  // Whether biometric state has been determined (async loading complete)
  const [biometricReady, setBiometricReady] = useState(false);

  // Track if we've already auto-prompted biometric for this lock session
  const hasAutoPromptedBiometric = useRef(false);
  // Guard against concurrent biometric attempts
  const biometricInProgress = useRef(false);

  // Can we use biometric for unlock?
  const canUseBiometric =
    biometricState?.isAvailable &&
    biometricState?.hasStoredKey &&
    enableBiometric &&
    !!onUnlockWithKey &&
    !!authenticateWithBiometric;

  const biometricActionLabel = (() => {
    switch (biometricState?.biometricType) {
      case 'facial':
        return t('lock.use_face_id');
      case 'fingerprint':
        return t('lock.use_touch_id');
      case 'iris':
        return t('lock.use_iris');
      default:
        return t('lock.use_biometric');
    }
  })();

  // Get biometric label for accessibility
  const getBiometricLabel = () => t('lock.use_biometric');

  // Animation
  const translateY = useSharedValue(locked ? 0 : -screenHeight);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // -------------------------------------------------------------------------
  // Lock/Unlock Animation
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (locked) {
      // Gate appears instantly — no slide-down animation
      setIsVisible(true);
      setPassword('');
      setError(null);
      setShowPasswordFallback(false);
      translateY.value = 0;
    } else if (isVisible) {
      // Unlock: slide gate up to header position, then hide
      const targetY = headerHeight ? -(screenHeight - headerHeight) : -screenHeight;
      translateY.value = withTiming(
        targetY,
        {
          duration: UNLOCK_ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setIsVisible)(false);
            if (onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, screenHeight, headerHeight, translateY]);

  // -------------------------------------------------------------------------
  // Biometric Unlock
  // -------------------------------------------------------------------------

  const handleBiometricUnlock = useCallback(async () => {
    if (!onUnlockWithKey || !authenticateWithBiometric) return;
    if (biometricInProgress.current) return;

    biometricInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const keyJson = await authenticateWithBiometric();

      if (!keyJson) {
        // User cancelled or auth failed — show password fallback
        setShowPasswordFallback(true);
        return;
      }

      const success = await onUnlockWithKey(keyJson);

      if (!success) {
        setError(t('lock.biometric_unlock_failed') || 'Biometric unlock failed');
        setShowPasswordFallback(true);
      }
    } catch (err) {
      console.error('Biometric unlock failed:', err);
      setError(t('lock.biometric_unlock_failed') || 'Biometric unlock failed');
      setShowPasswordFallback(true);
    } finally {
      setIsLoading(false);
      biometricInProgress.current = false;
    }
  }, [onUnlockWithKey, authenticateWithBiometric, t]);

  // -------------------------------------------------------------------------
  // Auto-prompt biometric when lock screen appears
  // -------------------------------------------------------------------------

  // Reset state when unlocked
  useEffect(() => {
    if (!locked || !isVisible) {
      hasAutoPromptedBiometric.current = false;
      setBiometricReady(false);
      setShowPasswordFallback(false);
    }
  }, [isVisible, locked]);

  // Refresh biometric state when lock screen becomes visible,
  // then mark biometric as ready so we can decide what to show
  useEffect(() => {
    if (!isVisible || !locked) return;

    let cancelled = false;

    const init = async () => {
      if (refreshBiometricState) {
        await refreshBiometricState();
      }
      if (!cancelled) {
        setBiometricReady(true);
      }
    };

    void init();

    return () => { cancelled = true; };
  }, [isVisible, locked, refreshBiometricState]);

  // Once biometric state is ready, decide: auto-prompt biometric OR show password
  useEffect(() => {
    if (!locked || !isVisible || !biometricReady || hasAutoPromptedBiometric.current) {
      return;
    }

    hasAutoPromptedBiometric.current = true;

    if (canUseBiometric) {
      // Delay to let the lock animation settle before Face ID prompt
      const timer = setTimeout(() => {
        void handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // No biometric available — show password immediately
      setShowPasswordFallback(true);
    }
  // canUseBiometric and handleBiometricUnlock are intentionally evaluated only
  // when biometricReady flips to true. We don't want re-runs on their changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, isVisible, biometricReady]);

  // -------------------------------------------------------------------------
  // Password Unlock
  // -------------------------------------------------------------------------

  const handleUnlock = useCallback(async () => {
    if (!password.trim()) {
      setError(t('lock.enter_password_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      const success = await onUnlock(password);

      if (!success) {
        setError(t('lock.wrong_password'));
        setPassword('');
        setShowLoadingScreen(false);
      }
    } catch (err) {
      console.error('Unlock failed:', err);
      setError(t('lock.unlock_failed'));
      setPassword('');
      setShowLoadingScreen(false);
    } finally {
      setIsLoading(false);
    }
  }, [password, onUnlock, t]);

  // -------------------------------------------------------------------------
  // Forgot Password
  // -------------------------------------------------------------------------

  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      t('lock.reset_wallet_title'),
      t('lock.reset_wallet_message'),
      [
        { text: t('lock.cancel'), style: 'cancel' },
        {
          text: t('lock.reset_button'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('lock.confirm_title'),
              t('lock.confirm_message'),
              [
                { text: t('lock.cancel'), style: 'cancel' },
                {
                  text: t('lock.delete_button'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onRemoveAllAccounts();
                    } catch (err) {
                      console.error('Failed to reset wallet:', err);
                      Alert.alert(t('general.error'), t('lock.reset_failed'));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [onRemoveAllAccounts, t]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getInputBorderColor = () => {
    if (error) return colors.status.error;
    if (isFocused) return colors.accent.primary;
    return colors.input.border;
  };

  if (!isVisible) {
    return null;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <Animated.View style={[styles.overlay, animatedStyle]}>
        <LinearGradient
          colors={[colors.background.primary, colors.background.secondary]}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <StatusBar style="light" />
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <View style={styles.content}>
                  {/* Logo Section */}
                  <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                      <Image
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    </View>

                    <Text style={styles.welcomeText}>{t('lock.welcome_back')}</Text>

                    {/* Password Input - only shown as fallback */}
                    {showPasswordFallback && (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            { borderColor: getInputBorderColor() },
                          ]}
                          placeholder={t('lock.enter_password')}
                          placeholderTextColor={colors.text.secondary}
                          secureTextEntry
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (error) setError(null);
                          }}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          onSubmitEditing={handleUnlock}
                          editable={!isLoading}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                        />

                        {error && (
                          <Text style={styles.errorText}>{error}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Button Section — only shown when password fallback is active */}
                  {showPasswordFallback && (
                    <View style={styles.buttonSection}>
                      <TouchableOpacity
                        onPress={handleUnlock}
                        disabled={isLoading || !password.trim()}
                        activeOpacity={0.8}
                        style={styles.buttonContainer}
                      >
                        <LinearGradient
                          colors={[...gradients.primary.colors]}
                          style={[
                            styles.button,
                            (isLoading || !password.trim()) && styles.buttonDisabled,
                          ]}
                          start={gradients.primary.start}
                          end={gradients.primary.end}
                        >
                          {isLoading ? (
                            <ActivityIndicator color={colors.text.primary} />
                          ) : (
                            <Text style={styles.buttonText}>{t('lock.unlock')}</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {canUseBiometric && (
                        <TouchableOpacity
                          onPress={() => { void handleBiometricUnlock(); }}
                          disabled={isLoading}
                          style={styles.secondaryActionContainer}
                        >
                          <Text style={styles.secondaryActionText}>
                            {biometricActionLabel}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={handleForgotPassword}
                        disabled={isLoading}
                        style={styles.forgotPasswordContainer}
                      >
                        <Text style={styles.forgotPasswordText}>
                          {t('lock.forgot_password')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <LoadingScreen
        visible={showLoadingScreen}
        title={t('lock.unlocking') || 'Unlocking Wallet'}
        showTips={true}
        tipInterval={3000}
      />
    </>
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
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(spacing.lockScreenPadding),
    gap: vs(spacing['4xl']),
  },
  logoSection: {
    width: '100%',
    alignItems: 'center',
    gap: vs(spacing.lockScreenSectionGap),
  },
  logoContainer: {},
  logo: {
    width: s(componentSizes.lockScreenLogoSize),
    height: s(componentSizes.lockScreenLogoSize),
  },
  welcomeText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize['2xl']),
    letterSpacing: letterSpacing.balance,
    lineHeight: vs(38),
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: vs(componentSizes.iconSize5XL),
    backgroundColor: colors.input.background,
    borderWidth: borderWidth.sheet,
    borderRadius: borderRadius.badge,
    paddingHorizontal: s(spacing.lg),
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: ms(fontSize.lg),
  },
  errorText: {
    color: colors.status.error,
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.sm),
    lineHeight: ms(fontSize.sm * lineHeight.normal),
    marginTop: vs(spacing.sm),
    paddingHorizontal: s(spacing.sm),
  },
  buttonSection: {
    width: '100%',
    gap: vs(spacing.lockScreenGap),
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: vs(componentSizes.iconSize4XL),
    borderRadius: borderRadius.xl,
    borderWidth: borderWidth.thin,
    borderColor: colors.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  buttonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  buttonText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize.md),
    lineHeight: ms(16 * lineHeight.normal),
  },
  biometricContainer: {
    alignItems: 'center',
  },
  biometricButton: {
    width: s(componentSizes.biometricButtonSize),
    height: s(componentSizes.biometricButtonSize),
    borderRadius: 32,
    backgroundColor: colors.input.background,
    borderWidth: borderWidth.sheet,
    borderColor: colors.input.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(spacing.sm),
  },
  biometricText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: ms(fontSize.sm),
    lineHeight: ms(fontSize.sm * lineHeight.normal),
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    padding: s(spacing.md),
  },
  secondaryActionContainer: {
    padding: s(spacing.md),
  },
  secondaryActionText: {
    color: colors.accent.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize.md),
    lineHeight: ms(16 * lineHeight.normal),
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: ms(fontSize.md),
    letterSpacing: letterSpacing.balance,
    lineHeight: vs(38),
    textAlign: 'center',
  },
});

export default LockScreenOverlay;
