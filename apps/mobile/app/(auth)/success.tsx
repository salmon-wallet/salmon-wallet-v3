/**
 * SuccessScreen - Congratulations screen shown after wallet creation/recovery
 *
 * This screen is displayed after the user has successfully created or recovered
 * their wallet. It provides navigation to the main app and option to check
 * derived accounts.
 *
 * Design: Dark gradient background with centered content, salmon logo, and action buttons.
 */

import { Logo } from '@salmon/assets';
import {
  borderRadius,
  colors,
  componentSizes,
  contentPadding,
  spacing,
} from '@salmon/shared';
import {
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '@salmon/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// Component
// ============================================================================

export default function SuccessScreen() {
  const { t } = useTranslation();
  const { isCreate } = useLocalSearchParams<{ isCreate?: string }>();
  const [showDialog, setShowDialog] = useState(false);

  /**
   * Toggle the derivable info dialog
   */
  const toggleDialog = useCallback(() => {
    setShowDialog((prev) => !prev);
  }, []);

  /**
   * Navigate to the main app, replacing the auth stack
   */
  const handleGoToWallet = useCallback(() => {
    router.replace('/(app)/(tabs)');
  }, []);

  /**
   * Navigate to derived accounts screen
   */
  const handleGoToDerived = useCallback(() => {
    router.push('/(auth)/derived-accounts');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Top spacer for centering */}
        <View style={styles.topSpacer} />

        {/* Centered content */}
        <View style={styles.centerContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={Logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('wallet.create.success_message')}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t('wallet.create.success_message_body')}
          </Text>
        </View>

        {/* Bottom buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary Button - Go to Wallet */}
          <PrimaryButton
            onPress={handleGoToWallet}
            style={styles.buttonSpacing}
          >
            {t('wallet.create.go_to_my_wallet')}
          </PrimaryButton>

          {/* Secondary Button - Check Derived Accounts */}
          <SecondaryButton
            onPress={handleGoToDerived}
            style={styles.buttonSpacing}
          >
            {t('wallet.create.check_derivables')}
          </SecondaryButton>

          {/* Info Link - What are derived accounts? */}
          <TextButton
            onPress={toggleDialog}
            color={colors.text.secondary}
          >
            {t('wallet.create.derivable_info_icon')}
          </TextButton>
        </View>
      </View>

      {/* Derivable Info Dialog */}
      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={toggleDialog}
      >
        <Pressable style={styles.dialogOverlay} onPress={toggleDialog}>
          <Pressable style={styles.dialogContent} onPress={() => { }}>
            {/* Dialog Title */}
            <Text style={styles.dialogTitle}>
              {t('wallet.create.derivable_info')}
            </Text>

            {/* Dialog Description */}
            <Text style={styles.dialogBody}>
              {t('wallet.create.derivable_description')}
            </Text>

            {/* Close Button */}
            <PrimaryButton onPress={toggleDialog}>
              {t('actions.continue')}
            </PrimaryButton>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: contentPadding.screen,
  },
  topSpacer: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: componentSizes.logoSizeLarge,
    height: componentSizes.logoSizeLarge,
  },
  title: {
    color: colors.text.primary,
    fontFamily: 'DMSansBold',
    fontSize: 32,
    lineHeight: 40,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing['2xl'],
  },
  buttonSpacing: {
    marginBottom: spacing.lg,
  },
  // Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: colors.dialog.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: contentPadding.screen,
  },
  dialogContent: {
    width: '100%',
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dialog.border,
    padding: spacing['2xl'],
  },
  dialogTitle: {
    color: colors.text.primary,
    fontFamily: 'DMSansBold',
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dialogBody: {
    color: colors.text.secondary,
    fontFamily: 'DMSansRegular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
});
