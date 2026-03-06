/**
 * AccountsPanel - Account management list for mobile
 *
 * Displays all user accounts with avatar, name, truncated address,
 * active indicator, and edit/delete actions. Includes an "Add Account"
 * button as the list footer.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  colors,
  spacing,
  borderRadius,
  borderWidth,
  fontSize,
  lineHeight,
  fontFamilyNative,
  getAvatarColor,
  getShortAddress,
  getInitials,
  getAccountAddress,
  type Account,
} from '@salmon/shared';
import { SettingsScreenLayout } from '../SettingsScreenLayout';
import type { AccountsPanelProps } from './types';

// ============================================================================
// AccountListItem
// ============================================================================

function AccountListItem({
  account,
  isActive,
  onPress,
  onEdit,
  onDelete,
  canDelete,
}: {
  account: Account;
  isActive: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const avatarColor = useMemo(() => getAvatarColor(account.id), [account.id]);
  const initials = useMemo(() => getInitials(account.name), [account.name]);
  const address = useMemo(() => getAccountAddress(account), [account]);
  const truncatedAddress = useMemo(() => getShortAddress(address), [address]);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.accountItem, isActive && styles.accountItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${account.name}${isActive ? ', active' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {/* Avatar */}
      {account.avatar && !imgError ? (
        <Image
          source={{ uri: account.avatar }}
          style={styles.avatar}
          contentFit="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <Text style={styles.accountName} numberOfLines={1}>
          {account.name}
        </Text>
        {truncatedAddress ? (
          <Text style={styles.accountAddress} numberOfLines={1}>
            {truncatedAddress}
          </Text>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityLabel="Edit account"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            activeOpacity={0.7}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.status.error} />
          </TouchableOpacity>
        )}

        {isActive && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// AccountsPanel
// ============================================================================

export function AccountsPanel({
  accounts,
  activeAccountId,
  onSelectAccount,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
  onBack,
}: AccountsPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const canDelete = accounts.length > 1;

  const handleDelete = useCallback(
    (accountId: string, accountName: string) => {
      Alert.alert(
        t('settings.wallets.delete_confirm_title'),
        t('settings.wallets.delete_confirm_message', { name: accountName }),
        [
          { text: t('actions.cancel'), style: 'cancel' },
          {
            text: t('actions.remove'),
            style: 'destructive',
            onPress: () => onDeleteAccount(accountId),
          },
        ],
      );
    },
    [onDeleteAccount, t],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Account>) => (
      <AccountListItem
        account={item}
        isActive={item.id === activeAccountId}
        onPress={() => onSelectAccount(item.id)}
        onEdit={() => onEditAccount(item.id)}
        onDelete={() => handleDelete(item.id, item.name)}
        canDelete={canDelete}
      />
    ),
    [activeAccountId, onSelectAccount, onEditAccount, handleDelete, canDelete],
  );

  const keyExtractor = useCallback((item: Account) => item.id, []);

  const ListFooter = useMemo(
    () => (
      <TouchableOpacity
        style={styles.addAccountButton}
        onPress={onAddAccount}
        activeOpacity={0.7}
        accessibilityLabel={t('settings.accounts.title')}
        accessibilityRole="button"
      >
        <View style={styles.addAccountIcon}>
          <Ionicons name="add" size={24} color={colors.text.primary} />
        </View>
        <Text style={styles.addAccountText}>
          {t('settings.account_add.title')}
        </Text>
      </TouchableOpacity>
    ),
    [onAddAccount, t],
  );

  return (
    <SettingsScreenLayout title={t('settings.accounts.title')} onBack={onBack}>
      <FlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </SettingsScreenLayout>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  accountItemActive: {
    backgroundColor: colors.background.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.tokenIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.bold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.none,
  },
  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  accountName: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  accountAddress: {
    color: colors.text.secondary,
    fontFamily: fontFamilyNative.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    marginTop: spacing.xxs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  checkmarkContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  addAccountIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.tokenIcon,
    backgroundColor: colors.background.card,
    borderWidth: borderWidth.thin,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountText: {
    color: colors.text.primary,
    fontFamily: fontFamilyNative.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    marginLeft: spacing.md,
  },
});
