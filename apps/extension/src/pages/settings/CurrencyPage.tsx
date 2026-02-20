/**
 * CurrencyPage - Display currency selection page for browser extension
 *
 * This page allows users to select their preferred display currency
 * for showing portfolio values and token prices.
 *
 * Features:
 * - List of supported fiat currencies
 * - Visual indicator for selected currency
 * - Persists selection via CurrencyContext
 */

import React, { useCallback } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  borderRadius,
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  useCurrencyContext,
  type CurrencyCode,
} from '@salmon/shared';
import { SettingsPageLayout } from '../../components/SettingsPageLayout';

// ============================================================================
// Types
// ============================================================================

export interface CurrencyPageProps {
  /** Callback to navigate back to home */
  onBack: () => void;
}

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

const CurrencySymbol = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: borderRadius.md,
  backgroundColor: colors.background.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.md,
});

const SymbolText = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  color: colors.text.primary,
});

const CheckIconStyled = styled(CheckIcon)({
  color: colors.accent.primary,
  fontSize: 20,
});

// ============================================================================
// Component
// ============================================================================

export function CurrencyPage({ onBack }: CurrencyPageProps): React.ReactElement {
  const { t } = useTranslation();
  const [{ currency }, { changeCurrency }] = useCurrencyContext();

  const handleCurrencySelect = useCallback(async (code: CurrencyCode) => {
    await changeCurrency(code);
  }, [changeCurrency]);

  return (
    <SettingsPageLayout
      title={t('settings.currency', 'Display Currency')}
      onBack={onBack}
    >
        <StyledList>
          {SUPPORTED_CURRENCIES.map((code) => {
            const info = CURRENCY_MAP[code];
            const isSelected = currency === code;

            return (
              <ListItem key={code} disablePadding>
                <StyledListItemButton
                  selected={isSelected}
                  onClick={() => handleCurrencySelect(code)}
                >
                  <CurrencySymbol>
                    <SymbolText>{info.symbol}</SymbolText>
                  </CurrencySymbol>
                  <ListItemText
                    primary={info.name}
                    secondary={code.toUpperCase()}
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

export default CurrencyPage;
