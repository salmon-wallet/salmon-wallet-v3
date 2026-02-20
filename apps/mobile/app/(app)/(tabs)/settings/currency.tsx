/**
 * CurrencyScreen - Display currency selection screen
 *
 * This screen allows users to select their preferred display currency
 * for showing portfolio values and token prices.
 *
 * Design: Dark gradient background with list of currency options.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  useCurrencyContext,
  type CurrencyCode,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../../../../src/components';

// ============================================================================
// Component
// ============================================================================

export default function CurrencyScreen() {
  const { t } = useTranslation();
  const [{ currency }, { changeCurrency }] = useCurrencyContext();

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
    await changeCurrency(code);
    router.back();
  }, [changeCurrency]);

  /**
   * Render a currency option
   */
  const renderCurrencyOption = useCallback(
    (code: CurrencyCode) => {
      const info = CURRENCY_MAP[code];
      const isSelected = code === currency;

      return (
        <TouchableOpacity
          key={code}
          style={[
            styles.currencyOption,
            isSelected && styles.currencyOptionSelected,
          ]}
          onPress={() => handleSelectCurrency(code)}
          activeOpacity={0.7}
        >
          <View style={styles.currencyInfo}>
            <Text style={styles.currencySymbol}>{info.symbol}</Text>
            <View style={styles.currencyTextContainer}>
              <Text style={styles.currencyCode}>{code.toUpperCase()}</Text>
              <Text style={styles.currencyName}>{info.name}</Text>
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
    [currency, handleSelectCurrency]
  );

  return (
    <SettingsScreenLayout title={t('settings.currency')} onBack={handleBack}>
      {SUPPORTED_CURRENCIES.map(renderCurrencyOption)}
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
