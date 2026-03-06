/**
 * AddressBookAdd - Add new contact to address book (mobile)
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
  useAddressBookForm,
  type AddressBookAddBaseProps,
fontSize, opacity, } from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';
import { InputAddress } from '../InputAddress';

// ============================================================================
// Component
// ============================================================================

export function AddressBookAdd({
  activeNetworkId,
  activeNetworkName: _activeNetworkName,
  activeBlockchain,
  onSave,
  onBack,
}: AddressBookAddBaseProps) {
  const { t } = useTranslation();
  const form = useAddressBookForm({ networkId: activeNetworkId });

  const handleSave = useCallback(async () => {
    if (!form.canSave) return;
    await onSave(form.buildInput());
  }, [form, onSave]);

  return (
    <SettingsScreenLayout
      title={t('settings.addressbook.add', 'Add Address')}
      onBack={onBack}
    >
      {/* Label */}
      <Text style={styles.fieldLabel}>
        {t('settings.addressbook.label', 'Label')}
      </Text>
      <TextInput
        style={styles.textInput}
        value={form.label}
        onChangeText={form.setLabel}
        placeholder={t('settings.addressbook.label', 'Label')}
        placeholderTextColor={colors.text.tertiary}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {/* Address */}
      <View style={styles.addressSection}>
        <InputAddress
          address={form.address}
          onChange={form.setAddress}
          onValidation={form.handleValidation}
          label={t('general.address', 'Address')}
          placeholder={t('general.name_or_address', {
            token: activeBlockchain,
            defaultValue: 'Enter address or domain',
          })}
        />
      </View>

      {/* Network (read-only) */}
      <Text style={styles.fieldLabel}>Network</Text>
      <View style={styles.networkDisplay}>
        <Text style={styles.networkText}>{activeBlockchain.charAt(0).toUpperCase() + activeBlockchain.slice(1)}</Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, !form.canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!form.canSave}
        activeOpacity={0.7}
      >
        <Text style={styles.saveButtonText}>
          {t('settings.addressbook.save', 'Save Address')}
        </Text>
      </TouchableOpacity>
    </SettingsScreenLayout>
  );
}

export default AddressBookAdd;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  fieldLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
  },
  addressSection: {
    marginTop: spacing.lg,
  },
  networkDisplay: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  networkText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.md,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  saveButtonDisabled: {
    opacity: opacity.faint,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
  },
});
