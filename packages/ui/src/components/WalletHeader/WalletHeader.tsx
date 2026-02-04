import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, borderWidth, shadows, s, vs, ms } from '@salmon/shared';
import { WalletSvgIcon, ContentCopySvgIcon, SettingsSvgIcon } from '../Icon';
import type { WalletHeaderProps } from './types';

/**
 * Truncates an address to show first 4 and last 4 characters
 * Matches Figma format: "ABcd...XYZ1"
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * WalletHeader component for displaying account info and navigation
 *
 * Displays (matching Figma design):
 * - Wallet icon on the left
 * - Account name with truncated address: "Account 1 (ABcd...XYZ1)"
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
  const insets = useSafeAreaInsets();

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

  // Format: "Account 1 (ABcd...XYZ1)" matching Figma
  const displayText = `${accountName} (${truncatedAddress})`;

  // Calculate top padding:
  // - iOS: Use safe area inset (for notch/dynamic island)
  // - Android: Use safe area inset (handles status bar)
  // - Web: No safe area needed (use 0)
  const safeAreaTop = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.outerContainer, { paddingTop: safeAreaTop }, style]}>
      <View style={styles.innerContainer}>
        {/* Left side - Wallet icon + Account info */}
        <View style={styles.leftSection}>
          {/* Wallet icon */}
          <TouchableOpacity
            style={styles.walletIconContainer}
            onPress={handleWalletPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Switch wallet account"
          >
            <WalletSvgIcon size={24} color={colors.text.muted} />
          </TouchableOpacity>

          {/* Account name + address in single line */}
          <View style={styles.accountInfo}>
            <Text style={styles.accountText} numberOfLines={1}>
              {displayText}
            </Text>
            {/* Copy button */}
            <TouchableOpacity
              onPress={handleCopyPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Copy wallet address ${truncatedAddress}`}
              style={styles.copyButton}
            >
              <ContentCopySvgIcon size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right side - Settings button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsSvgIcon size={24} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    // Transparent background to allow card to show through corner areas
    backgroundColor: 'transparent',
    // Ensure header appears above the balance card (curtain effect)
    zIndex: 10,
    // Position absolutely to allow card to slide behind
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(spacing['2xl']),
    paddingBottom: vs(spacing.md),
    // Design specs from Figma:
    // - Background color: #10131c (bg-darken)
    backgroundColor: colors.background.primary,
    // - Rounded bottom corners: 34.557px
    borderBottomLeftRadius: borderRadius.header,
    borderBottomRightRadius: borderRadius.header,
    // - Bottom border: 1.38px rgba(255,255,255,0.8)
    borderBottomWidth: borderWidth.header,
    borderBottomColor: colors.border.light,
    // - Shadow: 0px 10px 20px rgba(0,0,0,0.9)
    ...Platform.select({
      ios: {
        shadowColor: shadows.header.shadowColor,
        shadowOffset: shadows.header.shadowOffset,
        shadowOpacity: shadows.header.shadowOpacity,
        shadowRadius: shadows.header.shadowRadius,
      },
      android: {
        elevation: shadows.header.elevation,
      },
      default: {}, // Web doesn't need RN shadow
    }),
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.base), // Figma: 10px gap between wallet icon and account info
  },
  walletIconContainer: {
    width: s(43),
    height: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.sm),
  },
  accountText: {
    fontSize: ms(16.587),
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: ms(0.166, 0.3),
    lineHeight: vs(22),
  },
  copyButton: {
    padding: s(spacing.xs),
  },
  settingsButton: {
    width: s(43),
    height: vs(46),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalletHeader;
