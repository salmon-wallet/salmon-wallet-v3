/**
 * LockScreenOverlay - Animated lock screen overlay with slide animation
 *
 * This component renders the lock screen as an overlay on top of the app content.
 * The lock screen acts like a curtain/sheet that slides down when locking and
 * slides up when unlocking, revealing the home screen underneath.
 *
 * Features:
 * - Password-based unlock with PBKDF2 key derivation
 * - Optional biometric unlock (Face ID / Touch ID) via injectable BiometricConfig
 * - Slide-down animation when locking (entering)
 * - Slide-up animation when unlocking (exiting)
 *
 * Animation:
 * - Lock: translateY from -screenHeight to 0 (slide down into view)
 * - Unlock: translateY from 0 to -screenHeight (slide up out of view)
 * - Duration: 800ms with cubic easing
 */

import { Ionicons } from '@expo/vector-icons';
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
} from '@salmon/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
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

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// Animation configuration
const ANIMATION_DURATION = 800; // ms - slower for better visual effect

// ============================================================================
// Component
// ============================================================================

export function LockScreenOverlay({
  locked,
  onUnlock,
  onUnlockWithKey,
  onGetDerivedKey,
  onRemoveAllAccounts,
  onAnimationComplete,
  biometric,
}: LockScreenOverlayProps) {
  // Translation hook
  const { t } = useTranslation();

  // Get screen dimensions reactively
  const { height: screenHeight } = useWindowDimensions();

  // Extract biometric properties (with safe defaults when not provided)
  const biometricState = biometric?.state;
  const authenticateWithBiometric = biometric?.authenticateWithBiometric;
  const storeKeyForBiometric = biometric?.storeKeyForBiometric;
  const enableBiometric = biometric?.enableBiometric ?? false;
  const refreshBiometricState = biometric?.refreshState;

  // State
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(locked);

  // Determine if biometric button should be shown
  const showBiometricButton =
    biometricState?.isAvailable &&
    biometricState?.hasStoredKey &&
    enableBiometric &&
    !!onUnlockWithKey;

  // Get the appropriate biometric icon
  const getBiometricIcon = (): IoniconsName => {
    switch (biometricState?.biometricType) {
      case 'facial':
        return 'scan-outline'; // Face ID style icon
      case 'fingerprint':
        return 'finger-print-outline';
      case 'iris':
        return 'eye-outline';
      default:
        return 'finger-print-outline';
    }
  };

  // Get biometric label for accessibility
  const getBiometricLabel = () => {
    switch (biometricState?.biometricType) {
      case 'facial':
        return t('lock.use_face_id') || 'Use Face ID';
      case 'fingerprint':
        return t('lock.use_touch_id') || 'Use Touch ID';
      case 'iris':
        return t('lock.use_iris') || 'Use Iris';
      default:
        return t('lock.use_biometric') || 'Use Biometric';
    }
  };

  // Animation - shared value for Y position
  // Initialize based on locked state: if locked, start visible (0); if not locked, start off-screen (-screenHeight)
  const translateY = useSharedValue(locked ? 0 : -screenHeight);

  // Animated style for the overlay
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Handle locked state changes - animate slide down (lock) or slide up (unlock)
  useEffect(() => {
    if (locked) {
      // Locking - slide DOWN into view (curtain coming down)
      // First make visible, then animate from off-screen to on-screen
      if (!isVisible) {
        setIsVisible(true);
        setPassword('');
        setError(null);
        // Start from above the screen
        translateY.value = -screenHeight;
      }
      // Animate down into view
      translateY.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else if (isVisible) {
      // Unlocking - slide UP out of view (curtain going up)
      translateY.value = withTiming(
        -screenHeight,
        {
          duration: ANIMATION_DURATION,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isVisible/onAnimationComplete intentionally omitted to avoid re-triggering animations
  }, [locked, screenHeight, translateY]);

  /**
   * Handle unlock attempt with password validation
   */
  const handleUnlock = useCallback(async () => {
    if (!password.trim()) {
      setError(t('lock.enter_password_error'));
      return;
    }

    // Don't show loading screen - let the slide animation be visible
    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      const success = await onUnlock(password);

      if (!success) {
        setError(t('lock.wrong_password'));
        setPassword('');
        setShowLoadingScreen(false); // Hide on error
      } else {
        // On successful password unlock, store the derived key for biometric
        if (enableBiometric && onGetDerivedKey && storeKeyForBiometric) {
          try {
            const keyJson = await onGetDerivedKey();
            if (keyJson) {
              await storeKeyForBiometric(keyJson);
            }
          } catch (keyError) {
            // Non-critical - biometric storage failed but password unlock succeeded
            console.warn('Failed to store key for biometric:', keyError);
          }
        }
      }
      // If success, the locked state will change and trigger the animation
      // Don't hide loading screen on success - the overlay will dismiss
    } catch (err) {
      console.error('Unlock failed:', err);
      setError(t('lock.unlock_failed'));
      setPassword('');
      setShowLoadingScreen(false); // Hide on error
    } finally {
      setIsLoading(false);
    }
  }, [password, onUnlock, t, enableBiometric, onGetDerivedKey, storeKeyForBiometric]);

  /**
   * Handle biometric unlock attempt.
   * Uses the cached derived key to unlock without PBKDF2 derivation.
   */
  const handleBiometricUnlock = useCallback(async () => {
    if (!onUnlockWithKey || !authenticateWithBiometric) return;

    setIsLoading(true);
    setError(null);

    try {
      // Authenticate with biometrics and get the stored key
      const keyJson = await authenticateWithBiometric();

      if (!keyJson) {
        // User cancelled or authentication failed
        setIsLoading(false);
        return;
      }

      // Don't show loading screen - let the slide animation be visible
      // Unlock using the cached derived key (no PBKDF2 needed)
      const success = await onUnlockWithKey(keyJson);

      if (!success) {
        setError(t('lock.biometric_unlock_failed') || 'Biometric unlock failed');
        setShowLoadingScreen(false);
      }
      // If success, the locked state will change and trigger the animation
    } catch (err) {
      console.error('Biometric unlock failed:', err);
      setError(t('lock.biometric_unlock_failed') || 'Biometric unlock failed');
      setShowLoadingScreen(false);
    } finally {
      setIsLoading(false);
    }
  }, [onUnlockWithKey, authenticateWithBiometric, t]);

  // Refresh biometric state when component becomes visible
  useEffect(() => {
    if (isVisible && refreshBiometricState) {
      refreshBiometricState();
    }
  }, [isVisible, refreshBiometricState]);

  /**
   * Handle forgot password - shows warning and offers to reset wallet
   */
  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      t('lock.reset_wallet_title'),
      t('lock.reset_wallet_message'),
      [
        {
          text: t('lock.cancel'),
          style: 'cancel',
        },
        {
          text: t('lock.reset_button'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('lock.confirm_title'),
              t('lock.confirm_message'),
              [
                {
                  text: t('lock.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('lock.delete_button'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await onRemoveAllAccounts();
                      // Navigation will be handled by the parent layout
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

  /**
   * Determine input border color based on state
   */
  const getInputBorderColor = () => {
    if (error) return colors.status.error;
    if (isFocused) return colors.accent.primary;
    return colors.input.border;
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Existing overlay content */}
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
                  {/* Logo Section - Figma node 1702:6391 */}
                  <View style={styles.logoSection}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                      <Image
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Welcome Text */}
                    <Text style={styles.welcomeText}>{t('lock.welcome_back')}</Text>

                    {/* Password Input */}
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

                      {/* Error Message */}
                      {error && (
                        <Text style={styles.errorText}>{error}</Text>
                      )}
                    </View>
                  </View>

                  {/* Button Section - Figma node 1702:6407 */}
                  <View style={styles.buttonSection}>
                    {/* Unlock Button */}
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

                    {/* Biometric Unlock Button */}
                    {showBiometricButton && (
                      <TouchableOpacity
                        onPress={handleBiometricUnlock}
                        disabled={isLoading}
                        activeOpacity={0.7}
                        style={styles.biometricContainer}
                        accessibilityLabel={getBiometricLabel()}
                        accessibilityRole="button"
                      >
                        <View style={styles.biometricButton}>
                          <Ionicons
                            name={getBiometricIcon()}
                            size={ms(32)}
                            color={colors.text.primary}
                          />
                        </View>
                        <Text style={styles.biometricText}>
                          {getBiometricLabel()}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Forgot Password Link */}
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
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Loading Screen during unlock */}
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
  logoContainer: {
    // No margin - using gap in parent
  },
  // Adjusted: larger logo for better visibility
  logo: {
    width: s(140),
    height: s(140),
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
    height: vs(54),
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
    height: vs(53),
    borderRadius: borderRadius.xl,
    borderWidth: borderWidth.thin,
    borderColor: colors.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for button
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
    width: s(64),
    height: s(64),
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
