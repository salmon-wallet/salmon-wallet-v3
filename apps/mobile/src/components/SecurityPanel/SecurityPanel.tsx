/**
 * SecurityPanel - Security settings screen for mobile
 *
 * Features:
 * - Change password section with current/new/confirm inputs
 * - Password strength indicator
 * - Biometric toggle (if available and enrolled)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontFamilyNative,
  useAccountsContext,
  validatePassword,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';
import { PasswordInput, PasswordStrengthBar } from '../PasswordInput';
import { PrimaryButton } from '../Button';
import type { SecurityPanelProps } from './types';

// ============================================================================
// Component
// ============================================================================

export function SecurityPanel({
  onBack,
  isBiometricAvailable,
  isBiometricEnabled,
  onToggleBiometric,
}: SecurityPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const [, accountActions] = useAccountsContext();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePassword(newPassword);

  const handleChangePassword = useCallback(async () => {
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('settings.security.password_mismatch'));
      return;
    }

    if (!passwordValidation.isValid) {
      return;
    }

    setLoading(true);
    try {
      const success = await accountActions.changePassword(currentPassword, newPassword);
      if (success) {
        Alert.alert(
          t('settings.security.title'),
          t('settings.security.password_changed'),
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(t('settings.security.wrong_password'));
      }
    } catch {
      setError(t('settings.security.wrong_password'));
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, passwordValidation.isValid, accountActions, t]);

  return (
    <SettingsScreenLayout title={t('settings.security.title')} onBack={onBack}>
      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.security.change_password')}
        </Text>

        <View style={styles.inputGroup}>
          <PasswordInput
            value={currentPassword}
            onChangeText={(text: string) => {
              setCurrentPassword(text);
              if (error) setError('');
            }}
            placeholder={t('settings.security.current_password')}
          />
        </View>

        <View style={styles.inputGroup}>
          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('settings.security.new_password')}
          />
          {newPassword.length > 0 && (
            <PasswordStrengthBar strength={passwordValidation.strength} />
          )}
        </View>

        <View style={styles.inputGroup}>
          <PasswordInput
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            placeholder={t('settings.security.confirm_password')}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            onPress={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {t('settings.security.change_password_button')}
          </PrimaryButton>
        </View>
      </View>

      {/* Biometric Section */}
      {isBiometricAvailable && (
        <View style={styles.section}>
          <View style={styles.biometricRow}>
            <View style={styles.biometricInfo}>
              <Text style={styles.biometricTitle}>
                {t('settings.security.biometric_unlock')}
              </Text>
              <Text style={styles.biometricDescription}>
                {t('settings.security.biometric_description')}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={onToggleBiometric}
              trackColor={{ false: colors.background.card, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
          </View>
        </View>
      )}
    </SettingsScreenLayout>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.status.error,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  biometricInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  biometricTitle: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
    marginBottom: spacing['2xs'],
  },
  biometricDescription: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
  },
});
