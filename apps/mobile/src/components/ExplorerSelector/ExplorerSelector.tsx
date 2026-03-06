/**
 * ExplorerSelector - Block explorer selection component for mobile
 *
 * Displays a list of available block explorers and allows the user
 * to select their preferred one for the active blockchain.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
  type ExplorerSelectorBaseProps,
  type ExplorerSelectorItem,
fontSize,   borderWidth,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Component
// ============================================================================

export function ExplorerSelector({
  explorers,
  activeExplorerName,
  onSelectExplorer,
  onBack,
  loading,
}: ExplorerSelectorBaseProps) {
  const { t } = useTranslation();

  const renderExplorerOption = useCallback(
    (item: ExplorerSelectorItem) => {
      const isSelected = activeExplorerName === item.name;

      return (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.explorerOption,
            isSelected && styles.explorerOptionSelected,
          ]}
          onPress={() => onSelectExplorer(item.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.explorerName}>{item.name}</Text>

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
    [activeExplorerName, onSelectExplorer]
  );

  return (
    <SettingsScreenLayout
      title={t('settings.explorer', 'Block Explorer')}
      onBack={onBack}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      ) : explorers.length > 0 ? (
        explorers.map(renderExplorerOption)
      ) : (
        <Text style={styles.emptyText}>
          {t('common.no_explorers', 'No explorers available for this network')}
        </Text>
      )}
    </SettingsScreenLayout>
  );
}

export default ExplorerSelector;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  explorerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  explorerOptionSelected: {
    borderWidth: borderWidth.thin,
    borderColor: colors.accent.primary,
  },
  explorerName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.base,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
