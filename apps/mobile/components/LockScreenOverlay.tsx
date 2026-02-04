/**
 * LockScreenOverlay - Animated lock screen overlay with slide animation
 *
 * This component renders the lock screen as an overlay on top of the app content.
 * The lock screen acts like a curtain/sheet that slides down when locking and
 * slides up when unlocking, revealing the home screen underneath.
 *
 * Features:
 * - Password-based unlock with PBKDF2 key derivation
 * - Biometric unlock (Face ID / Touch ID) using cached derived key
 * - Slide-down animation when locking (entering)
 * - Slide-up animation when unlocking (exiting)
 *
 * Animation:
 * - Lock: translateY from -screenHeight to 0 (slide down into view)
 * - Unlock: translateY from 0 to -screenHeight (slide up out of view)
 * - Duration: 400ms with cubic easing
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@salmon/assets';
import { LoadingScreen } from '@salmon/ui';
import {
  colors,
  gradients,
  spacing,
  componentSizes,
  contentPadding,
  fontSize,
  lineHeight,
  s,
  vs,
  ms,
} from '@salmon/shared';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

// ============================================================================
// Font families for React Native (DM Sans loaded fonts)
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  // SemiBold/ExtraBold not available - using Bold as fallback
  semiBold: 'DMSansBold',
  bold: 'DMSansBold',
  extraBold: 'DMSansBold',
} as const;

// Animation configuration
const ANIMATION_DURATION = 800; // ms - slower for better visual effect

// ============================================================================
// Props
// ============================================================================

interface LockScreenOverlayProps {
  /** Whether the wallet is currently locked */
  locked: boolean;
  /** Callback to attempt unlock with password */
  onUnlock: (password: string) => Promise<boolean>;
  /**
   * Callback to unlock with cached derived key (for biometric unlock).
   * The keyJson is the serialized DerivedKeyCache from a previous password unlock.
   * Returns true if unlock succeeded.
   */
  onUnlockWithKey?: (keyJson: string) => Promise<boolean>;
  /**
   * Callback after successful password unlock to get the derived key.
   * This key should be stored for future biometric unlocks.
   */
  onGetDerivedKey?: () => Promise<string | null>;
  /** Callback to remove all accounts (reset wallet) */
  onRemoveAllAccounts: () => Promise<void>;
  /** Callback when animation completes after unlock */
  onAnimationComplete?: () => void;
}

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
}: LockScreenOverlayProps) {
  // Translation hook
  const { t } = useTranslation();

  // Get screen dimensions reactively
  const { height: screenHeight } = useWindowDimensions();

  // Biometric authentication hook
  const {
    state: biometricState,
    authenticateWithBiometric,
    storeKeyForBiometric,
    enableBiometric,
    refreshState: refreshBiometricState,
  } = useBiometricAuth();

  // State
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(locked);

  // Determine if biometric button should be shown
  const showBiometricButton =
    biometricState.isAvailable &&
    biometricState.hasStoredKey &&
    enableBiometric &&
    !!onUnlockWithKey;

  // Get the appropriate biometric icon
  const getBiometricIcon = () => {
    switch (biometricState.biometricType) {
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
    switch (biometricState.biometricType) {
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
  }, [locked, screenHeight]);

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
        if (enableBiometric && onGetDerivedKey) {
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
    if (!onUnlockWithKey) return;

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
    if (isVisible) {
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
    if (error) return colors.input.borderError;
    if (isFocused) return colors.input.borderFocus;
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
                        placeholderTextColor="#667294"
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
                            name={getBiometricIcon() as any}
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
  // Figma: px-35.85 (node 1702:6390) - gap adjusted to 40
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(36),
    gap: vs(40),
  },
  // Figma: gap-31.369 (node 1702:6391)
  logoSection: {
    width: '100%',
    alignItems: 'center',
    gap: vs(31),
  },
  logoContainer: {
    // No margin - using gap in parent
  },
  // Adjusted: larger logo for better visibility
  logo: {
    width: s(140),
    height: s(140),
  },
  // Figma: 26.887px, SemiBold, tracking -0.4555, lineHeight 37.962 (node 1702:6404)
  welcomeText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: ms(27),
    letterSpacing: -0.46,
    lineHeight: vs(38),
    textAlign: 'center',
  },
  // Figma: h-54.371, border-0.747, radius-8.963 (node 1702:6405)
  inputContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: vs(54),
    backgroundColor: colors.input.background,
    borderWidth: 0.75,
    borderRadius: 9,
    paddingHorizontal: s(spacing.lg),
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: ms(17),
  },
  errorText: {
    color: colors.status.error,
    fontFamily: FONT_FAMILY.regular,
    fontSize: ms(fontSize.sm),
    lineHeight: ms(fontSize.sm * lineHeight.normal),
    marginTop: vs(spacing.sm),
    paddingHorizontal: s(spacing.sm),
  },
  // Figma: gap-22.406 (node 1702:6407)
  buttonSection: {
    width: '100%',
    gap: vs(22),
  },
  buttonContainer: {
    width: '100%',
  },
  // Figma: h-53.126, radius-15.736, border-1.021 rgba(255,92,69,0.8), shadow (node 1702:6408)
  button: {
    width: '100%',
    height: vs(53),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for button
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: colors.button.disabledOpacity,
  },
  // Figma: 16.341px, ExtraBold (node 1702:6411)
  buttonText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.extraBold,
    fontSize: ms(16),
    lineHeight: ms(16 * 1.5),
  },
  biometricContainer: {
    alignItems: 'center',
  },
  biometricButton: {
    width: s(64),
    height: s(64),
    borderRadius: 32,
    backgroundColor: colors.input.background,
    borderWidth: 0.75,
    borderColor: colors.input.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(spacing.sm),
  },
  biometricText: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: ms(fontSize.sm),
    lineHeight: ms(fontSize.sm * lineHeight.normal),
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    padding: s(spacing.md),
  },
  // Figma: 14.938px, SemiBold, tracking -0.4555, lineHeight 37.962 (node 1702:6412)
  forgotPasswordText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: ms(15),
    letterSpacing: -0.46,
    lineHeight: vs(38),
    textAlign: 'center',
  },
});

export default LockScreenOverlay;
