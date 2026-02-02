import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
 * - Account name + truncated address
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
 * />
 * ```
 */
export const WalletHeader: React.FC<WalletHeaderProps> = ({
  accountName,
  address,
  onCopyAddress,
  onSettingsPress,
  style,
}) => {
  const handleCopyPress = useCallback(() => {
    onCopyAddress?.();
  }, [onCopyAddress]);

  const handleSettingsPress = useCallback(() => {
    onSettingsPress?.();
  }, [onSettingsPress]);

  const truncatedAddress = truncateAddress(address);

  return (
    <View style={[styles.container, style]}>
      {/* Left side - Account info with copy */}
      <TouchableOpacity
        style={styles.accountInfo}
        onPress={handleCopyPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Copy wallet address ${truncatedAddress}`}
      >
        <View style={styles.accountTextContainer}>
          <Text style={styles.accountName} numberOfLines={1}>
            {accountName}
          </Text>
          <View style={styles.addressContainer}>
            <Text style={styles.address} numberOfLines={1}>
              {truncatedAddress}
            </Text>
            <Ionicons
              name="copy-outline"
              size={14}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.copyIcon}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Right side - Settings button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettingsPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
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
    backgroundColor: '#0D0D0D',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
  copyIcon: {
    marginLeft: 6,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalletHeader;
