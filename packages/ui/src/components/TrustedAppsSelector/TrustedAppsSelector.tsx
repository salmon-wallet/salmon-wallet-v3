/**
 * TrustedAppsSelector - Connected dApps management component for browser extension
 *
 * Displays a list of trusted/connected dApps for the current network
 * and allows the user to revoke their access.
 */

import React, { useCallback, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  type TrustedAppsSelectorBaseProps,
  type TrustedAppItem,
} from '@salmon/shared';
import { SettingsPageLayout } from '../SettingsPageLayout';

// ============================================================================
// Styled Components
// ============================================================================

const StyledList = styled(List)({
  padding: `${spacing.sm}px 0`,
});

const StyledListItemButton = styled(ListItemButton)({
  padding: `${spacing.sm}px ${spacing.lg}px`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const RevokeButton = styled(IconButton)({
  color: colors.status.error,
  '&:hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

const AppAvatar = styled(Avatar)({
  width: 36,
  height: 36,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
});

const EmptyContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing['3xl']}px ${spacing.lg}px`,
  gap: spacing.sm,
});

const EmptyText = styled(Typography)({
  color: colors.text.secondary,
  fontSize: 14,
  textAlign: 'center',
});

const EmptySubtext = styled(Typography)({
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: 12,
  textAlign: 'center',
});

// ============================================================================
// Component
// ============================================================================

export function TrustedAppsSelector({
  apps,
  onRevokeApp,
  onBack,
}: TrustedAppsSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = useCallback(
    async (domain: string) => {
      setRevoking(domain);
      try {
        await onRevokeApp(domain);
      } finally {
        setRevoking(null);
      }
    },
    [onRevokeApp]
  );

  return (
    <SettingsPageLayout
      title={t('settings.trusted_apps', 'Trusted Apps')}
      onBack={onBack}
    >
      {apps.length > 0 ? (
        <StyledList>
          {apps.map((app: TrustedAppItem) => (
            <ListItem
              key={app.domain}
              disablePadding
              secondaryAction={
                <RevokeButton
                  edge="end"
                  onClick={() => handleRevoke(app.domain)}
                  disabled={revoking === app.domain}
                  size="small"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </RevokeButton>
              }
            >
              <StyledListItemButton disableRipple>
                <ListItemAvatar>
                  {app.icon ? (
                    <AppAvatar src={app.icon} alt={app.name || app.domain} />
                  ) : (
                    <AppAvatar>
                      <LanguageIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
                    </AppAvatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={app.name || app.domain}
                  secondary={app.name ? app.domain : undefined}
                  primaryTypographyProps={{
                    sx: {
                      color: colors.text.primary,
                      fontWeight: 500,
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      color: colors.text.secondary,
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              </StyledListItemButton>
            </ListItem>
          ))}
        </StyledList>
      ) : (
        <EmptyContainer>
          <EmptyText>
            {t('settings.no_trusted_apps', 'No connected apps')}
          </EmptyText>
          <EmptySubtext>
            {t(
              'settings.no_trusted_apps_hint',
              'Apps you connect to will appear here'
            )}
          </EmptySubtext>
        </EmptyContainer>
      )}
    </SettingsPageLayout>
  );
}

export default TrustedAppsSelector;
