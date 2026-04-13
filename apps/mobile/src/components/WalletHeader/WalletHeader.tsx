import { borderRadius, colors, fontFamilyNative, fontSize, fontWeight, letterSpacing, componentSizes, ms, s, shadows, spacing, vs, getShortAddress, getAvatarColor, getInitials } from '@salmon/shared';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ContentCopySvgIcon, SettingsSvgIcon, WalletSvgIcon } from '../Icon';
import { useTabChrome } from '../../../hooks/useTabChrome';
import type { WalletHeaderProps } from './types';



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
  developerMode = false,
  avatarUrl,
  accountId,
  style,
  animateIn,
}) => {
  const { t } = useTranslation();
  const { headerTopInset } = useTabChrome();
  const [imgError, setImgError] = useState(false);

  // Fade-in animation for header content after unlock
  const contentOpacity = useSharedValue(animateIn === false ? 0 : 1);

  useEffect(() => {
    console.log('[DEBUG WalletHeader] animateIn changed:', animateIn, 'current opacity:', contentOpacity.value);
    if (animateIn === undefined) return;
    if (animateIn) {
      console.log('[DEBUG WalletHeader] → animating opacity to 1');
      contentOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else {
      console.log('[DEBUG WalletHeader] → setting opacity to 0');
      contentOpacity.value = 0;
    }
  }, [animateIn, contentOpacity]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleCopyPress = useCallback(() => {
    onCopyAddress?.();
  }, [onCopyAddress]);

  const handleSettingsPress = useCallback(() => {
    onSettingsPress?.();
  }, [onSettingsPress]);

  const handleWalletPress = useCallback(() => {
    onWalletPress?.();
  }, [onWalletPress]);

  const truncatedAddress = getShortAddress(address, developerMode ? 8 : 4) ?? address;

  // Format: "Account 1 (ABcd...XYZ1)" matching Figma
  const displayText = `${accountName} (${truncatedAddress})`;

  // Fallback avatar color based on account ID
  const avatarColor = useMemo(
    () => (accountId ? getAvatarColor(accountId) : colors.text.muted),
    [accountId],
  );
  const initials = useMemo(() => getInitials(accountName), [accountName]);

  return (
    <View style={[styles.outerContainer, { paddingTop: headerTopInset }, style]}>
      <Animated.View style={[styles.innerContainer, animateIn !== undefined && contentAnimatedStyle]}>
        {/* Left side - Avatar/Wallet icon + Account info */}
        <View style={styles.leftSection}>
          {/* Avatar or wallet icon */}
          <TouchableOpacity
            style={styles.walletIconContainer}
            onPress={handleWalletPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.switch_wallet')}
          >
            {avatarUrl && !imgError ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.headerAvatar}
                contentFit="cover"
                onError={() => setImgError(true)}
              />
            ) : accountId ? (
              <View style={[styles.headerAvatarFallback, { backgroundColor: avatarColor }]}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            ) : (
              <WalletSvgIcon size={s(28)} color={colors.text.muted} />
            )}
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
              accessibilityLabel={t('accessibility.copy_address', { address: truncatedAddress })}
              style={styles.copyButton}
            >
              <ContentCopySvgIcon size={s(16)} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right side - Settings button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.open_settings')}
        >
          <SettingsSvgIcon size={s(30)} color={colors.text.muted} />
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: s(spacing.headerPadding),
    backgroundColor: colors.background.primary,
    borderBottomLeftRadius: borderRadius.header,
    borderBottomRightRadius: borderRadius.header,
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
      default: {},
    }),
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(spacing.base),
  },
  walletIconContainer: {
    width: s(componentSizes.iconSizeLarge),
    height: vs(componentSizes.buttonHeightSmall),
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
    fontSize: ms(fontSize.sm),
    fontFamily: fontFamilyNative.semiBold,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: letterSpacing.header,
    lineHeight: vs(22),
  },
  copyButton: {
    padding: s(spacing.xs),
  },
  settingsButton: {
    width: s(componentSizes.iconSizeLarge),
    height: vs(componentSizes.iconSizeLarge),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: s(componentSizes.iconSizeMButton),
    height: s(componentSizes.iconSizeMButton),
    borderRadius: s(14),
  },
  headerAvatarFallback: {
    width: s(componentSizes.iconSizeMButton),
    height: s(componentSizes.iconSizeMButton),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: colors.text.primary,
    fontSize: ms(fontSize.xs),
    fontFamily: fontFamilyNative.bold,
    fontWeight: fontWeight.bold,
  },
});

export default WalletHeader;
