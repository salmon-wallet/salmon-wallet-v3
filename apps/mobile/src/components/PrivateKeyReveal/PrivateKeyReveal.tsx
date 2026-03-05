/**
 * PrivateKeyReveal - Two-step private key reveal component
 *
 * Step 1: Network selection (skipped if only one network)
 * Step 2: Private key display with tap-to-reveal and optional biometric gate
 *
 * Follows the same patterns as backup.tsx for reveal overlay, copy, and layout.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  fontFamilyNative,
  getShortAddress,
  getAccountKeysForNetwork,
  type Account,
  type AccountKeyInfo,
} from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '../Button';
import { SettingsScreenLayout } from '../SettingsScreenLayout';

// ============================================================================
// Types
// ============================================================================

interface Network {
  id: string;
  name: string;
  blockchain: string;
}

export interface PrivateKeyRevealProps {
  networks: Network[];
  activeAccount: Account;
  onBack: () => void;
  biometricAvailable: boolean;
  authenticateWithBiometric: () => Promise<string | null>;
}

// ============================================================================
// Component
// ============================================================================

export function PrivateKeyReveal({
  networks,
  activeAccount,
  onBack,
  biometricAvailable,
  authenticateWithBiometric,
}: PrivateKeyRevealProps): React.ReactElement | null {
  const { t } = useTranslation();

  // Step management: 'selectNetwork' or 'displayKeys'
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    networks.length === 1 ? networks[0].id : null,
  );

  // Track which account indexes have been revealed (by index)
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Get accounts for the selected network
  const accountKeys: AccountKeyInfo[] = useMemo(
    () => getAccountKeysForNetwork(activeAccount, selectedNetworkId),
    [selectedNetworkId, activeAccount],
  );

  /**
   * Handle network selection
   */
  const handleSelectNetwork = useCallback((networkId: string) => {
    setSelectedNetworkId(networkId);
    setRevealedIndexes(new Set());
    setCopiedIndex(null);
  }, []);

  /**
   * Handle tap-to-reveal with optional biometric gate
   */
  const handleReveal = useCallback(
    async (index: number) => {
      if (biometricAvailable) {
        const result = await authenticateWithBiometric();
        if (result === null) return; // Auth failed, don't reveal
      }

      setRevealedIndexes((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    },
    [biometricAvailable, authenticateWithBiometric],
  );

  /**
   * Copy private key to clipboard
   */
  const handleCopy = useCallback(
    async (privateKey: string, index: number) => {
      if (!revealedIndexes.has(index)) return;

      try {
        await Clipboard.setStringAsync(privateKey);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (error) {
        console.error('Failed to copy private key:', error);
      }
    },
    [revealedIndexes],
  );

  /**
   * Handle back from key display to network selection
   */
  const handleBackToNetworks = useCallback(() => {
    setSelectedNetworkId(null);
    setRevealedIndexes(new Set());
    setCopiedIndex(null);
  }, []);

  // ========================================================================
  // Step 1: Network Selection
  // ========================================================================

  if (!selectedNetworkId) {
    return (
      <SettingsScreenLayout
        title={t('settings.select_network')}
        subtitle={t('settings.select_network_description')}
        onBack={onBack}
      >
        <View style={styles.networkList}>
          {networks.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={styles.networkCard}
              onPress={() => handleSelectNetwork(network.id)}
              activeOpacity={0.7}
            >
              <View style={styles.networkIconContainer}>
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={colors.text.primary}
                />
              </View>
              <View style={styles.networkInfo}>
                <Text style={styles.networkName}>{network.name}</Text>
                <Text style={styles.networkBlockchain}>
                  {network.blockchain.charAt(0).toUpperCase() + network.blockchain.slice(1)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </SettingsScreenLayout>
    );
  }

  // ========================================================================
  // Step 2: Private Key Display
  // ========================================================================

  return (
    <SettingsScreenLayout
      title={t('settings.private_key')}
      onBack={networks.length > 1 ? handleBackToNetworks : onBack}
    >
      {/* Warning */}
      <View style={styles.warningContainer}>
        <Ionicons
          name="warning-outline"
          size={20}
          color={colors.status.warning}
        />
        <Text style={styles.warningText}>
          {t('settings.private_key_warning')}
        </Text>
      </View>

      {/* Account cards */}
      {accountKeys.length === 0 ? (
        <Text style={styles.emptyText}>
          {t('settings.no_accounts_for_network')}
        </Text>
      ) : (
        accountKeys.map((accountKey, index) => {
          const isRevealed = revealedIndexes.has(index);
          const isCopied = copiedIndex === index;

          return (
            <View key={index} style={styles.keyCard}>
              {/* Derivation path and address */}
              <View style={styles.keyHeader}>
                <Text style={styles.pathLabel}>
                  {t('settings.derivation_path')}
                </Text>
                <Text style={styles.pathValue}>{accountKey.path}</Text>
                <Text style={styles.addressValue}>
                  {getShortAddress(accountKey.address, 8)}
                </Text>
              </View>

              {/* Private key with reveal overlay */}
              <View style={styles.keyContainer}>
                {!isRevealed && (
                  <TouchableOpacity
                    style={styles.revealOverlay}
                    onPress={() => handleReveal(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={32}
                      color={colors.text.primary}
                    />
                    <Text style={styles.revealText}>
                      {biometricAvailable
                        ? t('settings.authenticate_to_reveal')
                        : t('settings.wallets.tap_to_reveal')}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text
                  style={styles.keyText}
                  selectable={isRevealed}
                >
                  {isRevealed ? accountKey.privateKey : accountKey.privateKey.replace(/./g, '*')}
                </Text>
              </View>

              {/* Copy button */}
              <SecondaryButton
                onPress={() => handleCopy(accountKey.privateKey, index)}
                disabled={!isRevealed}
              >
                {isCopied ? t('wallet.copied') : t('actions.copy').toUpperCase()}
              </SecondaryButton>
            </View>
          );
        })
      )}

      {/* Done button */}
      <View style={styles.doneContainer}>
        <PrimaryButton onPress={onBack}>
          {t('actions.done').toUpperCase()}
        </PrimaryButton>
      </View>
    </SettingsScreenLayout>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Network selection
  networkList: {
    gap: spacing.sm,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  networkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 16,
  },
  networkBlockchain: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 13,
    marginTop: 2,
  },
  // Warning
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.warningBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  // Key card
  keyCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  keyHeader: {
    gap: 4,
  },
  pathLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pathValue: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
  },
  addressValue: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 13,
    marginTop: 2,
  },
  keyContainer: {
    position: 'relative',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 80,
    justifyContent: 'center',
  },
  keyText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  revealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.dark,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: spacing.sm,
  },
  revealText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: 16,
  },
  emptyText: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  doneContainer: {
    marginTop: spacing.md,
  },
});

export default PrivateKeyReveal;
