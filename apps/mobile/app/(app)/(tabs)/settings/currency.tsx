/**
 * CurrencyScreen - Display currency selection screen
 *
 * This screen allows users to select their preferred display currency
 * for showing portfolio values and token prices.
 *
 * Design: Dark gradient background with list of currency options.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../../../../src/components';

// ============================================================================
// Constants
// ============================================================================

/**
 * Available currencies
 */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]['code'];

// ============================================================================
// Component
// ============================================================================

export default function CurrencyScreen() {
  const { t } = useTranslation();

  // TODO: Integrate with user config storage when currency preference is added
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  /**
   * Handle currency selection
   */
  const handleSelectCurrency = useCallback(async (code: CurrencyCode) => {
    setSelectedCurrency(code);
    // TODO: Persist currency preference to storage
    // For now, just update local state and go back
    router.back();
  }, []);

  /**
   * Render a currency option
   */
  const renderCurrencyOption = useCallback(
    (currency: (typeof CURRENCIES)[number]) => {
      const isSelected = currency.code === selectedCurrency;

      return (
        <TouchableOpacity
          key={currency.code}
          style={[
            styles.currencyOption,
            isSelected && styles.currencyOptionSelected,
          ]}
          onPress={() => handleSelectCurrency(currency.code)}
          activeOpacity={0.7}
        >
          <View style={styles.currencyInfo}>
            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
            <View style={styles.currencyTextContainer}>
              <Text style={styles.currencyCode}>{currency.code}</Text>
              <Text style={styles.currencyName}>{currency.name}</Text>
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
    [selectedCurrency, handleSelectCurrency]
  );

  return (
    <SettingsScreenLayout title={t('settings.currency')} onBack={handleBack}>
      {CURRENCIES.map(renderCurrencyOption)}
    </SettingsScreenLayout>
  );
}

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
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currencySymbol: {
    width: 40,
    height: 40,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: 18,
    overflow: 'hidden',
  },
  currencyTextContainer: {
    gap: 2,
  },
  currencyCode: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 16,
  },
  currencyName: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
  },
});
