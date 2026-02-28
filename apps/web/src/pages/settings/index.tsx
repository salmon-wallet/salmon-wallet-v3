/**
 * Settings route pages -- thin wrappers around @salmon/ui selector components.
 * Each page provides the required props and onBack navigation via react-router.
 */
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  useAccountsContext,
  useCurrencyContext,
  useLanguage,
  CURRENCY_MAP, SUPPORTED_CURRENCIES,
  SUPPORT_OPTIONS,
  colors, fontFamily, fontSize, spacing,
} from '@salmon/shared';
import type { TrustedAppItem, LanguageSelectorItem, CurrencySelectorItem } from '@salmon/shared';
import {
  CurrencySelector, LanguageSelector, ExplorerSelector,
  SupportSelector, TrustedAppsSelector, NetworkSelector,
  ScreenHeader,
} from '@salmon/ui';

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export function CurrencyPage(): React.ReactElement {
  const navigate = useNavigate();
  const [{ currency }, { changeCurrency }] = useCurrencyContext();

  const currencies: CurrencySelectorItem[] = useMemo(
    () => SUPPORTED_CURRENCIES.map((code) => {
      const info = CURRENCY_MAP[code];
      return { code: info.code, name: info.name, symbol: info.symbol };
    }),
    [],
  );

  return (
    <CurrencySelector
      currencies={currencies}
      activeCurrencyCode={currency}
      onSelectCurrency={(code) => { changeCurrency(code as typeof currency); }}
      onBack={() => navigate('/settings')}
    />
  );
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export function LanguagePage(): React.ReactElement {
  const navigate = useNavigate();
  const { language, availableLanguages, languageNames, changeLanguage } = useLanguage();

  const languages: LanguageSelectorItem[] = useMemo(
    () => availableLanguages.map((code) => ({
      code,
      nativeName: languageNames[code],
    })),
    [availableLanguages, languageNames],
  );

  return (
    <LanguageSelector
      languages={languages}
      activeLanguageCode={language}
      onSelectLanguage={(code) => { changeLanguage(code as typeof language); }}
      onBack={() => navigate('/settings')}
    />
  );
}

// ---------------------------------------------------------------------------
// Explorer (placeholder -- needs useUserConfig wiring with active account)
// ---------------------------------------------------------------------------

export function ExplorerPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: colors.background.primary,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <ScreenHeader onBack={() => navigate('/settings')} />
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['2xl'],
      }}>
        <Typography sx={{
          color: colors.text.secondary,
          fontFamily: `${fontFamily.sans}, sans-serif`,
          fontSize: fontSize.lg,
          textAlign: 'center',
        }}>
          Explorer settings — coming soon
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export function SupportPage(): React.ReactElement {
  const navigate = useNavigate();

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <SupportSelector
      options={SUPPORT_OPTIONS}
      onOpenLink={handleOpenLink}
      onBack={() => navigate('/settings')}
    />
  );
}

// ---------------------------------------------------------------------------
// Trusted Apps
// ---------------------------------------------------------------------------

export function TrustedAppsPage(): React.ReactElement {
  const navigate = useNavigate();
  const [state, actions] = useAccountsContext();
  const { activeTrustedApps } = state;

  const trustedAppItems: TrustedAppItem[] = Object.entries(activeTrustedApps || {}).map(
    ([domain, app]) => ({ domain, name: app.name, icon: app.icon }),
  );

  const handleRevoke = useCallback(
    (domain: string) => { actions.removeTrustedApp(domain); },
    [actions],
  );

  return (
    <TrustedAppsSelector
      apps={trustedAppItems}
      onRevokeApp={handleRevoke}
      onBack={() => navigate('/settings')}
    />
  );
}

// ---------------------------------------------------------------------------
// Network (placeholder -- needs network list wiring)
// ---------------------------------------------------------------------------

export function NetworkPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: colors.background.primary,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <ScreenHeader onBack={() => navigate('/settings')} />
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['2xl'],
      }}>
        <Typography sx={{
          color: colors.text.secondary,
          fontFamily: `${fontFamily.sans}, sans-serif`,
          fontSize: fontSize.lg,
          textAlign: 'center',
        }}>
          Network settings — coming soon
        </Typography>
      </Box>
    </Box>
  );
}
