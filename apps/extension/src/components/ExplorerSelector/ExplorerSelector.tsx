/**
 * ExplorerSelector - Block explorer selection component for browser extension
 *
 * Displays a list of available block explorers and allows the user
 * to select their preferred one for the active blockchain.
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  type ExplorerSelectorBaseProps,
} from '@salmon/shared';
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

const EmptyState = styled(Typography)({
  color: colors.text.secondary,
  fontSize: 14,
  textAlign: 'center',
  padding: spacing.xl,
});

// ============================================================================
// Component
// ============================================================================

export function ExplorerSelector({
  explorers,
  activeExplorerName,
  onSelectExplorer,
  onBack,
  loading,
}: ExplorerSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (explorerKey: string) => {
      onSelectExplorer(explorerKey);
    },
    [onSelectExplorer]
  );

  if (loading) {
    return (
      <SettingsPageLayout
        title={t('settings.explorer', 'Block Explorer')}
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
      title={t('settings.explorer', 'Block Explorer')}
      onBack={onBack}
    >
      {explorers.length > 0 ? (
        <StyledList>
          {explorers.map((item) => {
            const isSelected = activeExplorerName === item.name;

            return (
              <ListItem key={item.key} disablePadding>
                <StyledListItemButton
                  selected={isSelected}
                  onClick={() => handleSelect(item.key)}
                >
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      sx: {
                        color: colors.text.primary,
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: 14,
                      },
                    }}
                  />
                  {isSelected && <CheckIconStyled />}
                </StyledListItemButton>
              </ListItem>
            );
          })}
        </StyledList>
      ) : (
        <EmptyState>
          {t('common.no_explorers', 'No explorers available for this network')}
        </EmptyState>
      )}
    </SettingsPageLayout>
  );
}

export default ExplorerSelector;
