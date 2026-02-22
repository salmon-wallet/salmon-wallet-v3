/**
 * AccountsPage - Account management list for extension
 *
 * Displays all user accounts with avatar, name, truncated address,
 * active indicator, and edit/delete actions. Includes an "Add Account" button.
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '../../utils/styled';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  getAvatarColor,
  getShortAddress,
  getInitials,
  getAccountAddress,
  useAccountsContext,
  type Account,
} from '@salmon/shared';
import { SettingsPageLayout } from '../../components/SettingsPageLayout';
import { ConfirmDialog } from '../../components';

// ============================================================================
// Types
// ============================================================================

export interface AccountsPageProps {
  onBack: () => void;
  onEditAccount: (accountId: string) => void;
  onAddAccount: () => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const AccountItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderRadius: borderRadius.md,
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
}));

const Avatar = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const AvatarImage = styled('img')({
  width: 40,
  height: 40,
  borderRadius: '50%',
  objectFit: 'cover',
});

const AccountInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const ActionButtons = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
});

const AddAccountButton = styled(ListItemButton)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  padding: `${spacing.md}px ${spacing.lg}px`,
  marginTop: spacing.sm,
});

const AddAccountIcon = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: `1px dashed ${colors.border.default}`,
});

// ============================================================================
// Component
// ============================================================================

export function AccountsPage({
  onBack,
  onEditAccount,
  onAddAccount,
}: AccountsPageProps): React.ReactElement {
  const { t } = useTranslation();
  const [accountState, accountActions] = useAccountsContext();
  const { accounts, accountId } = accountState;
  const canDelete = accounts.length > 1;

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [deletingAccountName, setDeletingAccountName] = useState('');

  const handleSelectAccount = useCallback(
    (targetId: string) => {
      if (targetId !== accountId) {
        accountActions.changeAccount(targetId);
      }
    },
    [accountId, accountActions],
  );

  const handleDeleteClick = useCallback(
    (account: Account) => {
      setDeletingAccountId(account.id);
      setDeletingAccountName(account.name);
      setDeleteDialogVisible(true);
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (deletingAccountId) {
      await accountActions.removeAccount(deletingAccountId);
    }
    setDeleteDialogVisible(false);
    setDeletingAccountId(null);
  }, [deletingAccountId, accountActions]);

  return (
    <SettingsPageLayout title={t('settings.accounts.title')} onBack={onBack}>
      <List disablePadding>
        {accounts.map((account) => {
          const isActive = account.id === accountId;
          const avatarColor = getAvatarColor(account.id);
          const initials = getInitials(account.name);
          const address = getAccountAddress(account);
          const truncated = getShortAddress(address);

          return (
            <AccountItem
              key={account.id}
              isActive={isActive}
              onClick={() => handleSelectAccount(account.id)}
            >
              {account.avatar ? (
                <AvatarImage src={account.avatar} alt={account.name} />
              ) : (
                <Avatar sx={{ backgroundColor: avatarColor }}>
                  <Typography
                    sx={{
                      color: colors.text.primary,
                      fontWeight: fontWeight.bold,
                      fontSize: fontSize.base,
                    }}
                  >
                    {initials}
                  </Typography>
                </Avatar>
              )}

              <AccountInfo>
                <Typography
                  noWrap
                  sx={{
                    color: colors.text.primary,
                    fontWeight: fontWeight.semibold,
                    fontSize: fontSize.base,
                  }}
                >
                  {account.name}
                </Typography>
                {truncated && (
                  <Typography
                    noWrap
                    sx={{
                      color: colors.text.secondary,
                      fontSize: fontSize.sm,
                    }}
                  >
                    {truncated}
                  </Typography>
                )}
              </AccountInfo>

              <ActionButtons>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAccount(account.id);
                  }}
                  sx={{ color: colors.text.secondary }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>

                {canDelete && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(account);
                    }}
                    sx={{ color: colors.status.error }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}

                {isActive && (
                  <CheckCircleIcon
                    sx={{ color: colors.status.success, fontSize: 24 }}
                  />
                )}
              </ActionButtons>
            </AccountItem>
          );
        })}
      </List>

      <AddAccountButton onClick={onAddAccount}>
        <AddAccountIcon>
          <AddIcon sx={{ color: colors.text.primary }} />
        </AddAccountIcon>
        <Typography
          sx={{
            color: colors.text.primary,
            fontWeight: fontWeight.semibold,
            fontSize: fontSize.base,
          }}
        >
          {t('settings.account_add.title')}
        </Typography>
      </AddAccountButton>

      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        title={t('settings.wallets.delete_confirm_title')}
        message={t('settings.wallets.delete_confirm_message', { name: deletingAccountName })}
        confirmText={t('actions.remove')}
        isDanger
        onConfirm={confirmDelete}
      />
    </SettingsPageLayout>
  );
}
