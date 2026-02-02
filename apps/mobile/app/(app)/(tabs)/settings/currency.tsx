/**
 * CurrencyScreen - Display currency selection screen
 *
 * This screen allows users to select their preferred display currency
 * for showing portfolio values and token prices.
 *
 * Design: Dark gradient background with list of currency options.
 */

import React, { useState, useCallback } from 'react';
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
        <Text style={styles.title}>{t('settings.currency')}</Text>

        {/* Currency List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {CURRENCIES.map(renderCurrencyOption)}
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
    marginBottom: spacing.lg,
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
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    overflow: 'hidden',
  },
  currencyTextContainer: {
    gap: 2,
  },
  currencyCode: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
  },
  currencyName: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
});
