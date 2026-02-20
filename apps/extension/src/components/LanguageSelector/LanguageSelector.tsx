/**
 * LanguageSelector - Language selection component for browser extension
 *
 * Displays a list of supported languages and allows the user
 * to select their preferred display language.
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  type LanguageSelectorBaseProps,
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

// ============================================================================
// Component
// ============================================================================

export function LanguageSelector({
  languages,
  activeLanguageCode,
  onSelectLanguage,
  onBack,
}: LanguageSelectorBaseProps): React.ReactElement {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (code: string) => {
      onSelectLanguage(code);
    },
    [onSelectLanguage]
  );

  return (
    <SettingsPageLayout
      title={t('settings.languages.title', 'Language')}
      onBack={onBack}
    >
      <StyledList>
        {languages.map((lang) => {
          const isSelected = activeLanguageCode === lang.code;

          return (
            <ListItem key={lang.code} disablePadding>
              <StyledListItemButton
                selected={isSelected}
                onClick={() => handleSelect(lang.code)}
              >
                <ListItemText
                  primary={lang.nativeName}
                  secondary={lang.code.toUpperCase()}
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

export default LanguageSelector;
