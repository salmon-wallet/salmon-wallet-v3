/**
 * BackupScreen - Backup/Export seed phrase screen
 *
 * This screen allows users to view and copy their seed phrase
 * for backup purposes. The seed phrase is revealed only after
 * user explicitly taps to reveal for security.
 *
 * Design: Dark gradient background with tap-to-reveal seed phrase
 * and copy functionality.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  contentPadding,
  useAccounts,
} from '@salmon/shared';
import {
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
} from '@salmon/ui';

// ============================================================================
// Constants
// ============================================================================

const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

// ============================================================================
// Component
// ============================================================================

export default function BackupScreen() {
  const { t } = useTranslation();
  const [accountState] = useAccounts();
  const { activeAccount } = accountState;

  // State
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get mnemonic from active account
  const mnemonic = useMemo(() => {
    return activeAccount?.mnemonic || '';
  }, [activeAccount]);

  // Split mnemonic into words for grid display
  const words = useMemo(() => {
    return mnemonic.split(' ').filter(Boolean);
  }, [mnemonic]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  /**
   * Toggle seed phrase visibility
   */
  const handleReveal = useCallback(() => {
    setShowSeedPhrase(!showSeedPhrase);
  }, [showSeedPhrase]);

  /**
   * Copy seed phrase to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!showSeedPhrase || !mnemonic) return;

    try {
      await Clipboard.setStringAsync(mnemonic);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy seed phrase:', error);
    }
  }, [showSeedPhrase, mnemonic]);

  /**
   * Render a single word in the grid
   */
  const renderWord = useCallback(
    (word: string, index: number) => {
      const displayWord = showSeedPhrase ? word : '******';

      return (
        <View key={index} style={styles.wordContainer}>
          <Text style={styles.wordIndex}>{index + 1}</Text>
          <Text style={styles.wordText}>{displayWord}</Text>
        </View>
      );
    },
    [showSeedPhrase]
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>{t('general.seed_phrase')}</Text>

          {/* Warning */}
          <View style={styles.warningContainer}>
            <Ionicons
              name="warning-outline"
              size={20}
              color={colors.status.warning}
            />
            <Text style={styles.warningText}>
              {t('wallet.create.messageBody')}
            </Text>
          </View>

          {/* Seed Phrase Grid */}
          <View style={styles.seedContainer}>
            {/* Tap to reveal overlay */}
            {!showSeedPhrase && (
              <TouchableOpacity
                style={styles.revealOverlay}
                onPress={handleReveal}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="eye-outline"
                  size={32}
                  color={colors.text.primary}
                />
                <Text style={styles.revealText}>
                  {t('settings.wallets.tap_to_reveal')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Word grid */}
            <View style={styles.wordsGrid}>
              {words.map(renderWord)}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <SecondaryButton
              onPress={handleCopy}
              disabled={!showSeedPhrase}
            >
              {copied
                ? t('wallet.copied')
                : t('actions.copy').toUpperCase()}
            </SecondaryButton>

            <PrimaryButton onPress={handleBack}>
              {t('actions.done').toUpperCase()}
            </PrimaryButton>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: contentPadding.screen,
    paddingBottom: spacing['2xl'],
  },
  title: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  seedContainer: {
    position: 'relative',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  revealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: spacing.sm,
  },
  revealText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordContainer: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  wordIndex: {
    color: colors.text.tertiary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  wordText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
  buttonContainer: {
    gap: spacing.md,
  },
});
