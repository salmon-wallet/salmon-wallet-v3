import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@salmon/shared';
import type { WalletHeaderProps } from './types';

/**
 * Truncates an address to show first 6 and last 4 characters
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * WalletHeader component for displaying account info and navigation
 *
 * Displays:
 * - Account name + truncated address (tappable for wallet switcher)
 * - Copy button to copy full address
 * - Settings icon for navigation
 *
 * @example
 * ```tsx
 * <WalletHeader
 *   accountName="Account 1"
 *   address="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
 *   onCopyAddress={() => Clipboard.setString(address)}
 *   onSettingsPress={() => navigation.navigate('Settings')}
 *   onWalletPress={() => setShowWalletSwitcher(true)}
 * />
 * ```
 */
export const WalletHeader: React.FC<WalletHeaderProps> = ({
  accountName,
  address,
  onCopyAddress,
  onSettingsPress,
  onWalletPress,
  style,
}) => {
  const handleCopyPress = useCallback(() => {
    onCopyAddress?.();
  }, [onCopyAddress]);

  const handleSettingsPress = useCallback(() => {
    onSettingsPress?.();
  }, [onSettingsPress]);

  const handleWalletPress = useCallback(() => {
    onWalletPress?.();
  }, [onWalletPress]);

  const truncatedAddress = truncateAddress(address);

  return (
    <View style={[styles.container, style]}>
      {/* Left side - Account info */}
      <View style={styles.accountSection}>
        {/* Account name - taps to open wallet switcher */}
        <TouchableOpacity
          style={styles.accountNameRow}
          onPress={handleWalletPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Switch wallet account"
        >
          <Text style={styles.accountName} numberOfLines={1}>
            {accountName}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.text.muted}
            style={styles.chevronIcon}
          />
        </TouchableOpacity>

        {/* Address - taps to copy */}
        <TouchableOpacity
          style={styles.addressContainer}
          onPress={handleCopyPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Copy wallet address ${truncatedAddress}`}
        >
          <Text style={styles.address} numberOfLines={1}>
            {truncatedAddress}
          </Text>
          <Ionicons
            name="copy-outline"
            size={14}
            color={colors.text.muted}
            style={styles.copyIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Right side - Settings button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettingsPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  accountSection: {
    flex: 1,
    marginRight: 16,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  chevronIcon: {
    marginLeft: 4,
    marginBottom: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 13,
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  copyIcon: {
    marginLeft: 6,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalletHeader;
