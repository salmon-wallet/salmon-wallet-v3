/**
 * SupportScreen - Help & Support screen
 *
 * This screen provides help resources and support options for users
 * including FAQs, documentation, and contact information.
 *
 * Design: Dark gradient background with list of support options.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  contentPadding,
} from '@salmon/shared';
import { ScreenHeader } from '@salmon/ui';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

/**
 * Support options configuration
 */
const SUPPORT_OPTIONS = [
  {
    id: 'faq',
    icon: 'help-circle-outline',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions',
    url: 'https://salmonwallet.io/faq',
  },
  {
    id: 'docs',
    icon: 'book-outline',
    title: 'Documentation',
    description: 'Learn how to use Salmon Wallet',
    url: 'https://docs.salmonwallet.io',
  },
  {
    id: 'twitter',
    icon: 'logo-twitter',
    title: 'Twitter / X',
    description: 'Get updates and reach out to us',
    url: 'https://twitter.com/salmonwallet',
  },
  {
    id: 'discord',
    icon: 'logo-discord',
    title: 'Discord Community',
    description: 'Join our community for support',
    url: 'https://discord.gg/salmonwallet',
  },
  {
    id: 'email',
    icon: 'mail-outline',
    title: 'Email Support',
    description: 'Contact us directly for help',
    url: 'mailto:support@salmonwallet.io',
  },
] as const;

// ============================================================================
// Component
// ============================================================================

export default function SupportScreen() {
  const { t } = useTranslation();

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  /**
   * Open external link
   */
  const handleOpenLink = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  }, []);

  /**
   * Render a support option card
   */
  const renderSupportOption = useCallback(
    (option: (typeof SUPPORT_OPTIONS)[number]) => (
      <TouchableOpacity
        key={option.id}
        style={styles.optionCard}
        onPress={() => handleOpenLink(option.url)}
        activeOpacity={0.7}
      >
        <View style={styles.optionIconContainer}>
          <Ionicons
            name={option.icon as any}
            size={24}
            color={colors.accent.primary}
          />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>
    ),
    [handleOpenLink]
  );

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <ScreenHeader onBack={handleBack} />

        {/* Title */}
        <Text style={styles.title}>{t('settings.help_support')}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Need help? We're here for you. Choose an option below to get support.
        </Text>

        {/* Support Options */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORT_OPTIONS.map(renderSupportOption)}

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.status.warning}
            />
            <Text style={styles.securityText}>
              Salmon Wallet team will never ask for your seed phrase or
              private keys. Never share this information with anyone.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: spacing.sm,
    paddingHorizontal: contentPadding.screen,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: contentPadding.screen,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: contentPadding.screen,
    paddingBottom: spacing['2xl'],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 92, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    marginBottom: 2,
  },
  optionDescription: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  securityText: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
