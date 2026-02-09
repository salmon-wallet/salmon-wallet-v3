/**
 * WalletSwitcherSheet Component
 *
 * A dialog component for selecting and managing wallet accounts.
 * Displays a list of accounts with avatars, names, addresses,
 * and action buttons for editing and deleting accounts.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { colors, spacing, borderRadius, getShortAddress } from '@salmon/shared';

import type { WalletSwitcherSheetProps, AccountListItemProps } from './types';
import { AVATAR_COLORS } from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a deterministic hash from a string.
 * Used to consistently map account IDs to colors.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets a deterministic color for an account based on its ID.
 */
function getAccountColor(accountId: string): string {
  const hash = hashString(accountId);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Gets initials from an account name.
 * Returns first letter of first two words, or first two letters if single word.
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.dialog.border}`,
    minWidth: 360,
    maxWidth: 400,
    maxHeight: '80vh',
  },
});

const StyledDialogTitle = styled(DialogTitle)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
});

const TitleText = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  overflowY: 'auto',
});

const StyledList = styled(List)({
  padding: `${spacing.sm}px 0`,
});

const StyledListItem = styled(ListItem)<{ isActive?: boolean }>(({ isActive }) => ({
  padding: `${spacing.md}px ${spacing.xl}px`,
  cursor: 'pointer',
  backgroundColor: isActive ? 'rgba(255, 92, 69, 0.1)' : 'transparent',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: isActive
      ? 'rgba(255, 92, 69, 0.15)'
      : 'rgba(255, 255, 255, 0.05)',
  },
}));

const AccountAvatar = styled(Avatar)<{ bgColor: string }>(({ bgColor }) => ({
  backgroundColor: bgColor,
  width: 40,
  height: 40,
  fontSize: 14,
  fontWeight: 600,
  color: '#FFFFFF',
}));

const AccountName = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const AccountAddress = styled(Typography)({
  fontSize: 12,
  color: colors.text.secondary,
  fontFamily: 'monospace',
});

const ActionButtonsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

const ActionIconButton = styled(IconButton)({
  padding: spacing.xs,
  color: colors.text.secondary,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const DeleteIconButton = styled(IconButton)({
  padding: spacing.xs,
  color: colors.status.error,
  '&:hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

const CheckIconStyled = styled(CheckIcon)({
  color: colors.accent.primary,
  marginLeft: spacing.sm,
});

const AddAccountButton = styled(Button)({
  width: '100%',
  padding: `${spacing.md}px ${spacing.xl}px`,
  justifyContent: 'flex-start',
  textTransform: 'none',
  color: colors.accent.primary,
  fontSize: 14,
  fontWeight: 600,
  '&:hover': {
    backgroundColor: 'rgba(255, 92, 69, 0.1)',
  },
});

const StyledDialogActions = styled(DialogActions)({
  padding: `${spacing.md}px ${spacing.xl}px`,
  borderTop: `1px solid ${colors.border.default}`,
});

// Confirmation Dialog Styles
const ConfirmDialogPaper = styled(Box)({
  backgroundColor: colors.dialog.background,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.dialog.border}`,
  padding: spacing.xl,
  textAlign: 'center',
});

const ConfirmTitle = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  color: colors.text.primary,
  marginBottom: spacing.md,
});

const ConfirmMessage = styled(Typography)({
  fontSize: 14,
  color: colors.text.secondary,
  marginBottom: spacing.xl,
});

const ConfirmButtonsRow = styled(Box)({
  display: 'flex',
  gap: spacing.md,
  justifyContent: 'center',
});

const CancelButton = styled(Button)({
  flex: 1,
  backgroundColor: colors.button.secondaryBackground,
  color: colors.button.secondaryText,
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const DeleteButton = styled(Button)({
  flex: 1,
  backgroundColor: colors.status.error,
  color: '#FFFFFF',
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  '&:hover': {
    backgroundColor: '#DC2626',
  },
});

// ============================================================================
// AccountListItem Component
// ============================================================================

/**
 * Individual account row in the wallet switcher list.
 */
function AccountListItem({
  account,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: AccountListItemProps) {
  const avatarColor = useMemo(() => getAccountColor(account.id), [account.id]);
  const initials = useMemo(() => getInitials(account.name), [account.name]);

  // Get the primary address from the first available network account
  const address = (() => {
    const networksAccounts = account.networksAccounts || {};
    const networkIds = Object.keys(networksAccounts);

    for (const networkId of networkIds) {
      const accounts = networksAccounts[networkId];
      if (accounts) {
        for (const blockchainAccount of accounts) {
          if (blockchainAccount) {
            return blockchainAccount.getReceiveAddress();
          }
        }
      }
    }
    return undefined;
  })();

  const truncatedAddress = getShortAddress(address, 6) || '...';

  const handleEditClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onEdit?.();
    },
    [onEdit]
  );

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <StyledListItem isActive={isActive} onClick={onSelect}>
      <ListItemAvatar>
        <AccountAvatar bgColor={avatarColor}>{initials}</AccountAvatar>
      </ListItemAvatar>
      <ListItemText
        primary={<AccountName>{account.name}</AccountName>}
        secondary={<AccountAddress>{truncatedAddress}</AccountAddress>}
        sx={{ marginRight: spacing.lg }}
      />
      <ListItemSecondaryAction>
        <ActionButtonsContainer>
          {isActive && <CheckIconStyled fontSize="small" />}
          {onEdit && (
            <ActionIconButton
              size="small"
              onClick={handleEditClick}
              aria-label="Edit account"
            >
              <EditIcon fontSize="small" />
            </ActionIconButton>
          )}
          {onDelete && (
            <DeleteIconButton
              size="small"
              onClick={handleDeleteClick}
              aria-label="Delete account"
            >
              <DeleteIcon fontSize="small" />
            </DeleteIconButton>
          )}
        </ActionButtonsContainer>
      </ListItemSecondaryAction>
    </StyledListItem>
  );
}

// ============================================================================
// WalletSwitcherSheet Component
// ============================================================================

/**
 * Dialog for switching between and managing wallet accounts.
 *
 * Features:
 * - List of all accounts with colored avatars and initials
 * - Truncated addresses (first 6...last 4 characters)
 * - Active account indicator (checkmark)
 * - Edit and delete buttons per account
 * - Add new account button
 * - Delete confirmation dialog
 *
 * @example
 * ```tsx
 * <WalletSwitcherSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   accounts={accounts}
 *   activeAccountId={activeAccount.id}
 *   onSelectAccount={(id) => changeAccount(id)}
 *   onAddAccount={() => navigate('/create-account')}
 *   onEditAccount={(id) => navigate(`/edit-account/${id}`)}
 *   onDeleteAccount={(id) => removeAccount(id)}
 * />
 * ```
 */
export function WalletSwitcherSheet({
  visible,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}: WalletSwitcherSheetProps) {
  const { t } = useTranslation();
  const [deleteConfirmAccountId, setDeleteConfirmAccountId] = useState<string | null>(null);

  // Find the account being deleted for display in confirmation
  const accountToDelete = useMemo(
    () => accounts.find((acc) => acc.id === deleteConfirmAccountId),
    [accounts, deleteConfirmAccountId]
  );

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      onSelectAccount(accountId);
      onClose();
    },
    [onSelectAccount, onClose]
  );

  const handleDeleteRequest = useCallback((accountId: string) => {
    setDeleteConfirmAccountId(accountId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmAccountId && onDeleteAccount) {
      onDeleteAccount(deleteConfirmAccountId);
    }
    setDeleteConfirmAccountId(null);
  }, [deleteConfirmAccountId, onDeleteAccount]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmAccountId(null);
  }, []);

  const handleAddAccount = useCallback(() => {
    onAddAccount();
    onClose();
  }, [onAddAccount, onClose]);

  return (
    <>
      {/* Main Wallet Switcher Dialog */}
      <StyledDialog
        open={visible}
        onClose={onClose}
        aria-labelledby="wallet-switcher-title"
      >
        <StyledDialogTitle id="wallet-switcher-title">
          <TitleText>
            {t('walletSwitcher.title', 'Your Wallets')}
          </TitleText>
          <CloseButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </CloseButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          <StyledList>
            {accounts.map((account) => (
              <AccountListItem
                key={account.id}
                account={account}
                isActive={account.id === activeAccountId}
                onSelect={() => handleSelectAccount(account.id)}
                onEdit={onEditAccount ? () => onEditAccount(account.id) : undefined}
                onDelete={onDeleteAccount ? () => handleDeleteRequest(account.id) : undefined}
              />
            ))}
          </StyledList>

          <Divider sx={{ borderColor: colors.border.default }} />

          <AddAccountButton
            startIcon={<AddIcon />}
            onClick={handleAddAccount}
          >
            {t('walletSwitcher.addAccount', 'Add New Account')}
          </AddAccountButton>
        </StyledDialogContent>
      </StyledDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmAccountId !== null}
        onClose={handleDeleteCancel}
        PaperComponent={({ children }) => (
          <ConfirmDialogPaper>{children}</ConfirmDialogPaper>
        )}
      >
        <ConfirmTitle>
          {t('walletSwitcher.deleteConfirmTitle', 'Delete Account?')}
        </ConfirmTitle>
        <ConfirmMessage>
          {t(
            'walletSwitcher.deleteConfirmMessage',
            'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
            { name: accountToDelete?.name || '' }
          )}
        </ConfirmMessage>
        <ConfirmButtonsRow>
          <CancelButton onClick={handleDeleteCancel}>
            {t('common.cancel', 'Cancel')}
          </CancelButton>
          <DeleteButton onClick={handleDeleteConfirm}>
            {t('common.delete', 'Delete')}
          </DeleteButton>
        </ConfirmButtonsRow>
      </Dialog>
    </>
  );
}

export default WalletSwitcherSheet;
