/**
 * AccountEditPanel - Account editing options
 *
 * Settings-style list with sections for name, avatar, backup seed, and export key.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '../../utils/styled';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  useAccountsContext,
  type Account,
} from '@salmon/shared';
import { SettingsPanelContent } from '../SettingsPanelContent';

// ============================================================================
// Types
// ============================================================================

export interface AccountEditPanelProps {
  accountId: string;
  onEditName: (accountId: string) => void;
  onEditAvatar: () => void;
  onBackupSeed: () => void;
  onExportPrivateKey: () => void;
  onBack: () => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const SectionContainer = styled(Box)({
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
});

const Row = styled(ListItemButton)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  padding: `${spacing.lg}px`,
});

const IconContainer = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: borderRadius.md,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const Divider = styled(Box)({
  height: 1,
  backgroundColor: colors.border.default,
  marginLeft: spacing.lg,
  marginRight: spacing.lg,
});

// ============================================================================
// Component
// ============================================================================

export function AccountEditPanel({
  accountId,
  onEditName,
  onEditAvatar,
  onBackupSeed,
  onExportPrivateKey,
  onBack,
}: AccountEditPanelProps): React.ReactElement {
  const { t } = useTranslation();
  const [accountState] = useAccountsContext();
  const account = accountState.accounts.find((a: Account) => a.id === accountId) || accountState.activeAccount;

  const sections = [
    {
      labelKey: 'settings.account_edit.name_section',
      icon: <TextFieldsIcon sx={{ color: colors.text.primary }} />,
      onPress: () => onEditName(accountId),
    },
    {
      labelKey: 'settings.account_edit.avatar_section',
      icon: <PersonIcon sx={{ color: colors.text.primary }} />,
      onPress: onEditAvatar,
    },
    {
      labelKey: 'settings.account_edit.backup_section',
      icon: <VpnKeyIcon sx={{ color: colors.text.primary }} />,
      onPress: onBackupSeed,
    },
    {
      labelKey: 'settings.account_edit.private_key_section',
      icon: <LockIcon sx={{ color: colors.text.primary }} />,
      onPress: onExportPrivateKey,
    },
  ];

  return (
    <SettingsPanelContent
      title={t('settings.account_edit.title')}
      onBack={onBack}
    >
      {account && (
        <Typography
          sx={{
            color: colors.text.secondary,
            fontSize: fontSize.base,
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {account.name}
        </Typography>
      )}

      <SectionContainer>
        {sections.map((item, index) => (
          <React.Fragment key={item.labelKey}>
            <Row onClick={item.onPress}>
              <IconContainer>{item.icon}</IconContainer>
              <Typography
                sx={{
                  flex: 1,
                  color: colors.text.primary,
                  fontWeight: fontWeight.semibold,
                  fontSize: fontSize.base,
                }}
              >
                {t(item.labelKey)}
              </Typography>
              <ChevronRightIcon sx={{ color: colors.text.secondary }} />
            </Row>
            {index < sections.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </SectionContainer>
    </SettingsPanelContent>
  );
}
