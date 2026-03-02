import React from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import { colors, spacing } from '@salmon/shared';

// ============================================================================
// Styled Components (shared across all settings selectors)
// ============================================================================

const StyledList = styled(List)({
  padding: `${spacing.sm}px 0`,
});

const StyledListItemButton = styled(ListItemButton)<{ $selected?: boolean }>(
  ({ $selected }) => ({
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: $selected ? 'rgba(255, 107, 74, 0.1)' : 'transparent',
    '&:hover': {
      backgroundColor: $selected
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
// Types
// ============================================================================

export interface SettingsSelectorListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  getPrimaryText: (item: T) => string;
  getSecondaryText?: (item: T) => string;
  secondaryTypographyProps?: Record<string, unknown>;
  renderLeadingElement?: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsSelectorList<T>({
  items,
  getKey,
  isSelected,
  onSelect,
  getPrimaryText,
  getSecondaryText,
  secondaryTypographyProps,
  renderLeadingElement,
  loading,
  emptyMessage,
}: SettingsSelectorListProps<T>): React.ReactElement {
  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={24} sx={{ color: colors.accent.primary }} />
      </LoadingContainer>
    );
  }

  if (items.length === 0 && emptyMessage) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <StyledList>
      {items.map((item) => {
        const selected = isSelected(item);

        return (
          <ListItem key={getKey(item)} disablePadding>
            <StyledListItemButton
              selected={selected}
              $selected={selected}
              onClick={() => onSelect(item)}
            >
              {renderLeadingElement?.(item)}
              <ListItemText
                primary={getPrimaryText(item)}
                secondary={getSecondaryText?.(item)}
                primaryTypographyProps={{
                  sx: {
                    color: colors.text.primary,
                    fontWeight: selected ? 600 : 500,
                    fontSize: 14,
                  },
                }}
                secondaryTypographyProps={
                  getSecondaryText
                    ? {
                        sx: {
                          color: colors.text.secondary,
                          fontSize: 12,
                          ...(secondaryTypographyProps || {}),
                        },
                      }
                    : undefined
                }
              />
              {selected && <CheckIconStyled />}
            </StyledListItemButton>
          </ListItem>
        );
      })}
    </StyledList>
  );
}
