/**
 * WalletSwitcherSheet - Account selection sheet component
 *
 * A TopSheet-based component that allows users to:
 * - View all their wallet accounts
 * - Switch between accounts
 * - Add new accounts
 *
 * Features:
 * - Slides down from the top of the screen
 * - Shows account name, avatar, and truncated address
 * - Highlights the currently active account with a checkmark
 * - Includes an "Add Account" button at the bottom
 *
 * @example
 * ```tsx
 * <WalletSwitcherSheet
 *   visible={showSwitcher}
 *   onClose={() => setShowSwitcher(false)}
 *   accounts={accounts}
 *   activeAccountId={accountId}
 *   onSelectAccount={handleSelectAccount}
 *   onAddAccount={handleAddAccount}
 * />
 * ```
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TopSheet } from '@salmon/ui';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  lineHeight,
  type Account,
} from '@salmon/shared';

import type {
  WalletSwitcherSheetProps,
  AccountListItemProps,
} from './types';

// ============================================================================
// Constants
// ============================================================================

// Font family for React Native (DM Sans loaded fonts)
const FONT_FAMILY = {
  regular: 'DMSansRegular',
  medium: 'DMSansMedium',
  bold: 'DMSansBold',
} as const;

// Avatar colors for generating colored circles based on account name
const AVATAR_COLORS = [
  '#FF5C45', // Primary accent
  '#10B981', // Success green
  '#F59E0B', // Warning orange
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#EF4444', // Red
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Truncates an address to show first 6 and last 4 characters
 * @param address - The full address string
 * @returns Truncated address like "ABC123...XYZ9"
 */
function truncateAddress(address: string): string {
  if (!address || address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Gets the initials from an account name
 * @param name - The account name
 * @returns Up to 2 characters for initials
 */
function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Gets a consistent color for an account based on its ID
 * @param id - The account ID
 * @returns A color from the AVATAR_COLORS array
 */
function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Gets the primary address from an account
 * Looks for mainnet address first, then any available address
 * @param account - The account object
 * @returns The address string or empty string if not found
 */
function getAccountAddress(account: Account): string {
  const { networksAccounts } = account;

  // Try mainnet first
  const mainnetAccounts = networksAccounts['mainnet-beta'];
  if (mainnetAccounts) {
    const activeAccount = mainnetAccounts.find(Boolean);
    if (activeAccount) {
      return activeAccount.getReceiveAddress?.() || '';
    }
  }

  // Fall back to any available network
  for (const networkAccounts of Object.values(networksAccounts)) {
    if (networkAccounts) {
      const activeAccount = networkAccounts.find(Boolean);
      if (activeAccount) {
        return activeAccount.getReceiveAddress?.() || '';
      }
    }
  }

  return '';
}

// ============================================================================
// AccountListItem Component
// ============================================================================

/**
 * Individual account item in the list
 */
function AccountListItem({
  account,
  isActive,
  onPress,
  onEdit,
  onDelete,
  canDelete,
}: AccountListItemProps): React.ReactElement {
  const avatarColor = useMemo(() => getAvatarColor(account.id), [account.id]);
  const initials = useMemo(() => getInitials(account.name), [account.name]);
  const address = useMemo(() => getAccountAddress(account), [account]);
  const truncatedAddress = useMemo(() => truncateAddress(address), [address]);

  return (
    <TouchableOpacity
      style={[
        styles.accountItem,
        isActive && styles.accountItemActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${account.name}${isActive ? ', active' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

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
        {/* Edit Button */}
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            activeOpacity={0.7}
            accessibilityLabel="Edit account"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, !canDelete && styles.actionButtonDisabled]}
            onPress={canDelete ? onDelete : undefined}
            activeOpacity={canDelete ? 0.7 : 1}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canDelete }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={!canDelete}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={canDelete ? colors.status.error : colors.text.disabled}
            />
          </TouchableOpacity>
        )}

        {/* Active Indicator */}
        {isActive && (
          <View style={styles.checkmarkContainer}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.status.success}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// WalletSwitcherSheet Component
// ============================================================================

export function WalletSwitcherSheet({
  visible,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: WalletSwitcherSheetProps): React.ReactElement {
  const { t } = useTranslation();

  // Determine if delete should be allowed (can't delete last account)
  const canDeleteAccounts = accounts.length > 1;

  /**
   * Handle account selection
   * Closes the sheet after selecting a different account
   */
  const handleSelectAccount = useCallback(
    (accountId: string) => {
      if (accountId !== activeAccountId) {
        onSelectAccount(accountId);
      }
      onClose();
    },
    [activeAccountId, onSelectAccount, onClose]
  );

  /**
   * Handle add account button press
   */
  const handleAddAccount = useCallback(() => {
    onClose();
    onAddAccount();
  }, [onClose, onAddAccount]);

  /**
   * Handle edit account button press
   */
  const handleEditAccount = useCallback(
    (accountId: string) => {
      onClose();
      onEditAccount?.(accountId);
    },
    [onClose, onEditAccount]
  );

  /**
   * Handle delete account button press
   * Shows confirmation alert before deleting
   */
  const handleDeleteAccount = useCallback(
    (accountId: string, accountName: string) => {
      if (!canDeleteAccounts) {
        Alert.alert(
          t('settings.wallets.delete_account'),
          t('settings.wallets.cannot_delete_last')
        );
        return;
      }

      Alert.alert(
        t('settings.wallets.delete_confirm_title'),
        t('settings.wallets.delete_confirm_message', { name: accountName }),
        [
          {
            text: t('actions.cancel'),
            style: 'cancel',
          },
          {
            text: t('actions.remove'),
            style: 'destructive',
            onPress: () => {
              onClose();
              onDeleteAccount?.(accountId);
            },
          },
        ]
      );
    },
    [canDeleteAccounts, onClose, onDeleteAccount, t]
  );

  /**
   * Render individual account item
   */
  const renderAccountItem = useCallback(
    ({ item }: ListRenderItemInfo<Account>) => (
      <AccountListItem
        account={item}
        isActive={item.id === activeAccountId}
        onPress={() => handleSelectAccount(item.id)}
        onEdit={onEditAccount ? () => handleEditAccount(item.id) : undefined}
        onDelete={onDeleteAccount ? () => handleDeleteAccount(item.id, item.name) : undefined}
        canDelete={canDeleteAccounts}
      />
    ),
    [activeAccountId, handleSelectAccount, handleEditAccount, handleDeleteAccount, onEditAccount, onDeleteAccount, canDeleteAccounts]
  );

  /**
   * Key extractor for FlatList
   */
  const keyExtractor = useCallback((item: Account) => item.id, []);

  /**
   * List footer with Add Account button
   */
  const ListFooter = useMemo(
    () => (
      <TouchableOpacity
        style={styles.addAccountButton}
        onPress={handleAddAccount}
        activeOpacity={0.7}
        accessibilityLabel={t('settings.wallets.add_new_wallet')}
        accessibilityRole="button"
      >
        <View style={styles.addAccountIcon}>
          <Ionicons
            name="add"
            size={24}
            color={colors.text.primary}
          />
        </View>
        <Text style={styles.addAccountText}>
          {t('settings.wallets.add_new_wallet')}
        </Text>
      </TouchableOpacity>
    ),
    [handleAddAccount, t]
  );

  /**
   * Empty state when no accounts exist
   */
  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons
          name="wallet-outline"
          size={48}
          color={colors.text.secondary}
        />
        <Text style={styles.emptyStateText}>
          {t('settings.wallets.your_wallets')}
        </Text>
      </View>
    ),
    [t]
  );

  return (
    <TopSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.wallets.your_wallets')}
      testID="wallet-switcher-sheet"
      maxHeightPercentage={0.6}
      contentStyle={styles.content}
    >
      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </TopSheet>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  accountItemActive: {
    backgroundColor: colors.background.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.bold,
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
    fontFamily: FONT_FAMILY.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  accountAddress: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    marginTop: spacing['2xs'],
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
  actionButtonDisabled: {
    opacity: 0.5,
  },
  checkmarkContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.lg,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  addAccountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountText: {
    color: colors.text.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    marginLeft: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default WalletSwitcherSheet;
