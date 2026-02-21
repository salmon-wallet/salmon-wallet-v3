import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, gradients, componentSizes, ms, vs, s, fontFamilyNative } from '@salmon/shared';
import type { TransactionSuccessScreenProps } from '@salmon/shared';
import { PrimaryButton } from '../Button';

// ============================================================================
// Component
// ============================================================================

export const TransactionSuccessScreen: React.FC<TransactionSuccessScreenProps> = ({
  title,
  summary,
  explorerUrl,
  onContinue,
}) => {
  const { t } = useTranslation();

  const circleScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const linkOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    circleScale.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 });
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    linkOpacity.value = withDelay(500, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [circleScale, checkOpacity, textOpacity, linkOpacity, buttonOpacity]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const linkStyle = useAnimatedStyle(() => ({
    opacity: linkOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleExplorerPress = () => {
    if (explorerUrl) {
      Linking.openURL(explorerUrl);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circleOuter, circleStyle]}>
        <Animated.Text style={[styles.checkmark, checkStyle]}>✓</Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
      </Animated.View>

      {explorerUrl && (
        <Animated.View style={[styles.linkContainer, linkStyle]}>
          <TouchableOpacity onPress={handleExplorerPress} activeOpacity={0.7}>
            <Text style={styles.explorerLink}>{t('transaction.viewOnExplorer')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <LinearGradient
          colors={gradients.primaryButton.colors}
          start={gradients.primaryButton.start}
          end={gradients.primaryButton.end}
          style={styles.buttonGradient}
        >
          <PrimaryButton onPress={onContinue} style={styles.button}>
            {t('transaction.continue')}
          </PrimaryButton>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(spacing.headerPadding),
    paddingBottom: vs(componentSizes.tabBarHeight + spacing.xl),
  },
  circleOuter: {
    width: vs(96),
    height: vs(96),
    borderRadius: vs(48),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(spacing['3xl']),
  },
  checkmark: {
    fontSize: ms(44),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: vs(spacing.lg),
  },
  title: {
    fontSize: ms(24),
    fontFamily: fontFamilyNative.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: vs(spacing.sm),
  },
  summary: {
    fontSize: ms(16),
    fontFamily: fontFamilyNative.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: vs(spacing['4xl']),
  },
  explorerLink: {
    fontSize: ms(14),
    fontFamily: fontFamilyNative.medium,
    color: colors.accent.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  buttonGradient: {
    borderRadius: borderRadius.lg,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 92, 69, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    minWidth: s(180),
    height: vs(42),
    backgroundColor: 'transparent',
  },
});
