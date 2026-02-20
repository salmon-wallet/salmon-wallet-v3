/**
 * NetworkSelector - Network selection component for browser extension
 *
 * Displays a list of available blockchain networks and allows the user
 * to switch between them. Networks are filtered by the developer mode
 * toggle (only mainnets when off, all networks when on).
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { colors, spacing, type NetworkSelectorBaseProps } from '@salmon/shared';
import { SettingsPageLayout } from '../SettingsPageLayout';

// ============================================================================
// Styled Components
// ============================================================================

const StyledList = styled(List)({
  padding: `${spacing.sm}px 0`,
});

const StyledListItemButton = styled(ListItemButton)<{ selected?: boolean }>(
  ({ selected }) => ({
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: selected ? 'rgba(255, 107, 74, 0.1)' : 'transparent',
    '&:hover': {
      backgroundColor: selected
        ? 'rgba(255, 107, 74, 0.15)'
        : 'rgba(255, 255, 255, 0.05)',
    },
  })
);

const CheckIconStyled = styled(CheckIcon)({
  color: colors.accent.primary,
  fontSize: 20,
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
});

// ============================================================================
// Component
// ============================================================================

export function NetworkSelector({
  networks,
  activeNetworkId,
  onSelectNetwork,
  onBack,
  loading,
}: NetworkSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (networkId: string) => {
      onSelectNetwork(networkId);
    },
    [onSelectNetwork]
  );

  if (loading) {
    return (
      <SettingsPageLayout
        title={t('settings.change_network', 'Network')}
        onBack={onBack}
      >
        <LoadingContainer>
          <CircularProgress size={24} sx={{ color: colors.accent.primary }} />
        </LoadingContainer>
      </SettingsPageLayout>
    );
  }

  return (
    <SettingsPageLayout
      title={t('settings.change_network', 'Network')}
      onBack={onBack}
    >
      <StyledList>
        {networks.map((network) => {
          const isSelected = activeNetworkId === network.id;

          return (
            <ListItem key={network.id} disablePadding>
              <StyledListItemButton
                selected={isSelected}
                onClick={() => handleSelect(network.id)}
              >
                <ListItemText
                  primary={network.name}
                  secondary={network.blockchain}
                  primaryTypographyProps={{
                    sx: {
                      color: colors.text.primary,
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: 14,
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      color: colors.text.secondary,
                      fontSize: 12,
                      textTransform: 'capitalize',
                    },
                  }}
                />
                {isSelected && <CheckIconStyled />}
              </StyledListItemButton>
            </ListItem>
          );
        })}
      </StyledList>
    </SettingsPageLayout>
  );
}

export default NetworkSelector;
