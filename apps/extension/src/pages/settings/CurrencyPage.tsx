/**
 * CurrencyPage - Display currency selection page for browser extension
 *
 * This page allows users to select their preferred display currency
 * for showing portfolio values and token prices.
 *
 * Features:
 * - List of supported fiat currencies
 * - Visual indicator for selected currency
 * - Persists selection to storage
 */

import React, { useCallback, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, getStorage, STORAGE_KEYS } from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface CurrencyPageProps {
  /** Callback to navigate back to home */
  onBack: () => void;
}

/**
 * Supported display currencies
 */
interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * List of supported fiat currencies
 */
const CURRENCIES: CurrencyOption[] = [
  { code: 'usd', name: 'US Dollar', symbol: '$' },
  { code: 'eur', name: 'Euro', symbol: '\u20AC' },
  { code: 'gbp', name: 'British Pound', symbol: '\u00A3' },
  { code: 'jpy', name: 'Japanese Yen', symbol: '\u00A5' },
  { code: 'cny', name: 'Chinese Yuan', symbol: '\u00A5' },
  { code: 'krw', name: 'South Korean Won', symbol: '\u20A9' },
  { code: 'inr', name: 'Indian Rupee', symbol: '\u20B9' },
  { code: 'cad', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'aud', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'chf', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'sgd', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'hkd', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'mxn', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'brl', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'try', name: 'Turkish Lira', symbol: '\u20BA' },
];

const DEFAULT_CURRENCY = 'usd';

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.border.default}`,
});

const BackButton = styled(IconButton)({
  color: colors.text.secondary,
  marginRight: spacing.sm,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const Title = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: colors.text.primary,
});

const Content = styled(Box)({
  flex: 1,
  overflowY: 'auto',
});

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

const LoadingContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
});

// ============================================================================
// Component
// ============================================================================

export function CurrencyPage({ onBack }: CurrencyPageProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved currency on mount
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const storage = getStorage();
        const saved = await storage.getItem<string>(STORAGE_KEYS.CURRENCY);
        if (saved && CURRENCIES.some((c) => c.code === saved)) {
          setSelectedCurrency(saved);
        }
      } catch (error) {
        console.error('Failed to load currency preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrency();
  }, []);

  const handleCurrencySelect = useCallback(async (currencyCode: string) => {
    setSelectedCurrency(currencyCode);

    try {
      const storage = getStorage();
      await storage.setItem(STORAGE_KEYS.CURRENCY, currencyCode);
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  }, []);

  if (isLoading) {
    return (
      <Container>
        <Header>
          <BackButton onClick={onBack} aria-label={t('actions.back', 'Back')}>
            <ArrowBackIcon />
          </BackButton>
          <Title>{t('settings.currency', 'Display Currency')}</Title>
        </Header>
        <LoadingContainer>
          <CircularProgress size={24} sx={{ color: colors.accent.primary }} />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack} aria-label={t('actions.back', 'Back')}>
          <ArrowBackIcon />
        </BackButton>
        <Title>{t('settings.currency', 'Display Currency')}</Title>
      </Header>

      <Content>
        <StyledList>
          {CURRENCIES.map((currency) => {
            const isSelected = selectedCurrency === currency.code;

            return (
              <ListItem key={currency.code} disablePadding>
                <StyledListItemButton
                  selected={isSelected}
                  onClick={() => handleCurrencySelect(currency.code)}
                >
                  <CurrencySymbol>
                    <SymbolText>{currency.symbol}</SymbolText>
                  </CurrencySymbol>
                  <ListItemText
                    primary={currency.name}
                    secondary={currency.code.toUpperCase()}
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
      </Content>
    </Container>
  );
}

export default CurrencyPage;
