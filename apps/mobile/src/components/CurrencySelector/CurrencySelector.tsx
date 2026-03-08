/**
 * CurrencySelector - Display currency selection component for mobile
 *
 * Displays a list of supported currencies and allows the user
 * to select their preferred display currency.
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
  type CurrencySelectorBaseProps,
  type CurrencySelectorItem,
  fontSize,
  borderWidth,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Component
// ============================================================================

export function CurrencySelector({
  currencies,
  activeCurrencyCode,
  onSelectCurrency,
  onBack,
}: CurrencySelectorBaseProps) {
  const { t } = useTranslation();

  const renderCurrencyOption = useCallback(
    (item: CurrencySelectorItem) => {
      const isSelected = activeCurrencyCode === item.code;

      return (
        <TouchableOpacity
          key={item.code}
          style={[
            styles.currencyOption,
            isSelected && styles.currencyOptionSelected,
          ]}
          onPress={() => onSelectCurrency(item.code)}
          activeOpacity={0.7}
        >
          <View style={styles.currencyInfo}>
            <View style={styles.symbolContainer}>
              <Text style={styles.symbolText}>{item.symbol}</Text>
            </View>
            <View style={styles.currencyText}>
              <Text style={styles.currencyName}>{item.name}</Text>
              <Text style={styles.currencyCode}>{item.code.toUpperCase()}</Text>
            </View>
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
    [activeCurrencyCode, onSelectCurrency],
  );

  return (
    <SettingsScreenLayout
      title={t('settings.currency', 'Display Currency')}
      onBack={onBack}
    >
      {currencies.map(renderCurrencyOption)}
    </SettingsScreenLayout>
  );
}

export default CurrencySelector;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  currencyOptionSelected: {
    borderWidth: borderWidth.thin,
    borderColor: colors.accent.primary,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  symbolContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  symbolText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: fontSize.lg,
  },
  currencyText: {
    gap: spacing.xxs,
  },
  currencyName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
  },
  currencyCode: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.base,
  },
});
