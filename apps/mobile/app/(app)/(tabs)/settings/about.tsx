/**
 * AboutScreen - About/app info screen
 *
 * This screen displays information about the Salmon Wallet app
 * including version, links to social media, and legal information.
 *
 * Design: Dark gradient background with app logo, version info,
 * and links to external resources.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import {
  colors,
  spacing,
  borderRadius,
  componentSizes,
  fontFamilyNative,
  useOpenLink,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../../../../src/components';
import { Logo } from '@salmon/assets';

// ============================================================================
// Constants
// ============================================================================

/**
 * External links
 */
const LINKS = {
  website: 'https://salmonwallet.io',
  twitter: 'https://twitter.com/salmonwallet',
  discord: 'https://discord.gg/salmonwallet',
  github: 'https://github.com/nickelify/salmon-wallet',
  support: 'https://salmonwallet.io/support',
  privacy: 'https://salmonwallet.io/privacy',
  terms: 'https://salmonwallet.io/terms',
} as const;

// ============================================================================
// Component
// ============================================================================

export default function AboutScreen() {
  const { t } = useTranslation();
  const openLink = useOpenLink();

  // Get app version from expo constants
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode?.toString() ||
    '1';

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  /**
   * Render a link item
   */
  const renderLinkItem = useCallback(
    (icon: string, label: string, url: string) => (
      <TouchableOpacity
        style={styles.linkItem}
        onPress={() => openLink(url)}
        activeOpacity={0.7}
      >
        <View style={styles.linkIconContainer}>
          <Ionicons name={icon as any} size={20} color={colors.text.primary} />
        </View>
        <Text style={styles.linkLabel}>{label}</Text>
        <Ionicons
          name="open-outline"
          size={18}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
    ),
    [openLink]
  );

  /**
   * Render a social media button
   */
  const renderSocialButton = useCallback(
    (icon: string, url: string) => (
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => openLink(url)}
        activeOpacity={0.7}
      >
        <Ionicons name={icon as any} size={24} color={colors.text.primary} />
      </TouchableOpacity>
    ),
    [openLink]
  );

  return (
    <SettingsScreenLayout title={t('settings.about')} onBack={handleBack}>
      {/* App Info Section */}
      <View style={styles.appInfoSection}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Salmon Wallet</Text>
        <Text style={styles.versionText}>
          {t('settings.app_version', { version: appVersion })}
        </Text>
        <Text style={styles.buildText}>Build {buildNumber}</Text>
      </View>

      {/* Social Links */}
      <View style={styles.socialSection}>
        <Text style={styles.sectionLabel}>{t('actions.follow_us')}</Text>
        <View style={styles.socialButtons}>
          {renderSocialButton('logo-twitter', LINKS.twitter)}
          {renderSocialButton('logo-discord', LINKS.discord)}
          {renderSocialButton('logo-github', LINKS.github)}
        </View>
      </View>

      {/* Links Section */}
      <View style={styles.linksSection}>
        {renderLinkItem('globe-outline', 'Website', LINKS.website)}
        {renderLinkItem('help-circle-outline', 'Support', LINKS.support)}
        {renderLinkItem('document-text-outline', 'Privacy Policy', LINKS.privacy)}
        {renderLinkItem('document-outline', 'Terms of Service', LINKS.terms)}
      </View>

      {/* Copyright */}
      <Text style={styles.copyright}>
        {'\u00A9'} {new Date().getFullYear()} Salmon Wallet.{'\n'}
        All rights reserved.
      </Text>
    </SettingsScreenLayout>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  appInfoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: componentSizes.logoSizeMedium,
    height: componentSizes.logoSizeMedium,
    marginBottom: spacing.lg,
  },
  appName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  versionText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 16,
    marginBottom: spacing.xxs,
  },
  buildText: {
    color: colors.text.tertiary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
  },
  socialSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksSection: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  linkLabel: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 16,
  },
  copyright: {
    color: colors.text.tertiary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
