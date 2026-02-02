/**
 * LockScreenOverlay - Animated lock screen overlay with slide-up animation
 *
 * This component renders the lock screen as an overlay on top of the app content.
 * When the user successfully unlocks, it animates upward (slides up) to reveal
 * the HomeScreen underneath.
 *
 * Animation: translateY from 0 to -screenHeight over 500ms with ease-out timing
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
  Dimensions,
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
import { Logo } from '@salmon/assets';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Design Tokens (from Figma spec)
// ============================================================================

const COLORS = {
  // Background gradient
  gradientStart: '#10131c',
  gradientEnd: '#161c2d',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8D98',
  textPlaceholder: '#6B6E7B',
  textError: '#FF4D4D',

  // Input
  inputBorder: '#404962',
  inputBorderFocus: '#FF6B00',
  inputBorderError: '#FF4D4D',
  inputBackground: 'rgba(64, 73, 98, 0.2)',

  // Button
  buttonGradientStart: '#FF8A00',
  buttonGradientEnd: '#FF6B00',
  buttonDisabled: 'rgba(255, 107, 0, 0.5)',
  buttonText: '#FFFFFF',

  // Link
  linkText: '#FFFFFF',
} as const;

const TYPOGRAPHY = {
  // Welcome text - Using DMSansBold for semibold effect
  welcomeTitle: {
    fontFamily: 'DMSansBold',
    fontSize: 36,
    lineHeight: 44,
  },
  // Input text
  inputText: {
    fontFamily: 'DMSansRegular',
    fontSize: 16,
    lineHeight: 24,
  },
  // Button text - Using DMSansBold for semibold effect
  buttonText: {
    fontFamily: 'DMSansBold',
    fontSize: 18,
    lineHeight: 24,
  },
  // Link text
  linkText: {
    fontFamily: 'DMSansRegular',
    fontSize: 14,
    lineHeight: 20,
  },
  // Error text
  errorText: {
    fontFamily: 'DMSansRegular',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

const SPACING = {
  logoSize: 137,
  contentPadding: 24,
  inputHeight: 56,
  buttonHeight: 56,
  buttonRadius: 21,
  inputRadius: 12,
  gap: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
} as const;

// Animation configuration
const ANIMATION_DURATION = 500; // ms

// ============================================================================
// Props
// ============================================================================

interface LockScreenOverlayProps {
  /** Whether the wallet is currently locked */
  locked: boolean;
  /** Callback to attempt unlock with password */
  onUnlock: (password: string) => Promise<boolean>;
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
  onRemoveAllAccounts,
  onAnimationComplete,
}: LockScreenOverlayProps) {
  // Translation hook
  const { t } = useTranslation();

  // State
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(locked);

  // Animation
  const translateY = useSharedValue(0);

  // Animated style for the overlay
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Handle locked state changes
  useEffect(() => {
    if (!locked && isVisible) {
      // Unlock animation - slide up
      translateY.value = withTiming(
        -SCREEN_HEIGHT,
        {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
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
    } else if (locked && !isVisible) {
      // Lock - reset position and show
      translateY.value = 0;
      setIsVisible(true);
      setPassword('');
      setError(null);
    }
  }, [locked, isVisible, translateY, onAnimationComplete]);

  /**
   * Handle unlock attempt with password validation
   */
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
      }
      // If success, the locked state will change and trigger the animation
    } catch (err) {
      console.error('Unlock failed:', err);
      setError(t('lock.unlock_failed'));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  }, [password, onUnlock, t]);

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
    if (error) return COLORS.inputBorderError;
    if (isFocused) return COLORS.inputBorderFocus;
    return COLORS.inputBorder;
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
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
                    placeholderTextColor={COLORS.textPlaceholder}
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

                {/* Unlock Button */}
                <TouchableOpacity
                  onPress={handleUnlock}
                  disabled={isLoading || !password.trim()}
                  activeOpacity={0.8}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
                    style={[
                      styles.button,
                      (isLoading || !password.trim()) && styles.buttonDisabled,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.buttonText} />
                    ) : (
                      <Text style={styles.buttonText}>{t('lock.unlock')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

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
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
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
    paddingHorizontal: SPACING.contentPadding,
  },
  logoContainer: {
    marginBottom: SPACING.gap.lg,
  },
  logo: {
    width: SPACING.logoSize,
    height: SPACING.logoSize,
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.welcomeTitle.fontFamily,
    fontSize: TYPOGRAPHY.welcomeTitle.fontSize,
    lineHeight: TYPOGRAPHY.welcomeTitle.lineHeight,
    marginBottom: SPACING.gap.xl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.gap.lg,
  },
  input: {
    width: '100%',
    height: SPACING.inputHeight,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderRadius: SPACING.inputRadius,
    paddingHorizontal: SPACING.gap.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.inputText.fontFamily,
    fontSize: TYPOGRAPHY.inputText.fontSize,
  },
  errorText: {
    color: COLORS.textError,
    fontFamily: TYPOGRAPHY.errorText.fontFamily,
    fontSize: TYPOGRAPHY.errorText.fontSize,
    lineHeight: TYPOGRAPHY.errorText.lineHeight,
    marginTop: SPACING.gap.xs,
    paddingHorizontal: SPACING.gap.xs,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SPACING.gap.lg,
  },
  button: {
    width: '100%',
    height: SPACING.buttonHeight,
    borderRadius: SPACING.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.buttonText,
    fontFamily: TYPOGRAPHY.buttonText.fontFamily,
    fontSize: TYPOGRAPHY.buttonText.fontSize,
    lineHeight: TYPOGRAPHY.buttonText.lineHeight,
  },
  forgotPasswordContainer: {
    padding: SPACING.gap.sm,
  },
  forgotPasswordText: {
    color: COLORS.linkText,
    fontFamily: TYPOGRAPHY.linkText.fontFamily,
    fontSize: TYPOGRAPHY.linkText.fontSize,
    lineHeight: TYPOGRAPHY.linkText.lineHeight,
    textAlign: 'center',
  },
});

export default LockScreenOverlay;
