/**
 * LanguageSelector - Language selection component for mobile
 *
 * Displays a list of supported languages and allows the user
 * to select their preferred display language.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
  type LanguageSelectorBaseProps,
  type LanguageSelectorItem,
fontSize,   borderWidth,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Component
// ============================================================================

export function LanguageSelector({
  languages,
  activeLanguageCode,
  onSelectLanguage,
  onBack,
}: LanguageSelectorBaseProps) {
  const { t } = useTranslation();

  const renderLanguageOption = useCallback(
    (lang: LanguageSelectorItem) => {
      const isSelected = activeLanguageCode === lang.code;

      return (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageOption,
            isSelected && styles.languageOptionSelected,
          ]}
          onPress={() => onSelectLanguage(lang.code)}
          activeOpacity={0.7}
        >
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{lang.nativeName}</Text>
            <Text style={styles.languageCode}>{lang.code.toUpperCase()}</Text>
          </View>

          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.accent.primary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [activeLanguageCode, onSelectLanguage]
  );

  return (
    <SettingsScreenLayout
      title={t('settings.languages.title', 'Language')}
      onBack={onBack}
    >
      {languages.map(renderLanguageOption)}
    </SettingsScreenLayout>
  );
}

export default LanguageSelector;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  languageOptionSelected: {
    borderWidth: borderWidth.thin,
    borderColor: colors.accent.primary,
  },
  languageInfo: {
    gap: spacing.xxs,
  },
  languageName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
  },
  languageCode: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.base,
  },
});
