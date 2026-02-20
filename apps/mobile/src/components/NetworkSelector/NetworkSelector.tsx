/**
 * NetworkSelector - Network selection component for mobile
 *
 * Displays a list of available blockchain networks and allows the user
 * to switch between them. Networks are filtered by the developer mode
 * toggle (only mainnets when off, all networks when on).
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
  type NetworkSelectorBaseProps,
  type NetworkSelectorItem,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Component
// ============================================================================

export function NetworkSelector({
  networks,
  activeNetworkId,
  onSelectNetwork,
  onBack,
  loading,
}: NetworkSelectorBaseProps) {
  const { t } = useTranslation();

  const renderNetworkOption = useCallback(
    (network: NetworkSelectorItem) => {
      const isSelected = activeNetworkId === network.id;

      return (
        <TouchableOpacity
          key={network.id}
          style={[
            styles.networkOption,
            isSelected && styles.networkOptionSelected,
          ]}
          onPress={() => onSelectNetwork(network.id)}
          activeOpacity={0.7}
        >
          <View style={styles.networkInfo}>
            <Text style={styles.networkName}>{network.name}</Text>
            <Text style={styles.networkBlockchain}>{network.blockchain}</Text>
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
    [activeNetworkId, onSelectNetwork]
  );

  return (
    <SettingsScreenLayout
      title={t('settings.change_network', 'Network')}
      onBack={onBack}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
        </View>
      ) : (
        networks.map(renderNetworkOption)
      )}
    </SettingsScreenLayout>
  );
}

export default NetworkSelector;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  networkOptionSelected: {
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  networkInfo: {
    gap: 2,
  },
  networkName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 16,
  },
  networkBlockchain: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
