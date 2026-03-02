import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors, spacing, fontFamily, fontSize, vs, ms,
  scanDerivedAccounts, SCAN_NETWORKS,
  fetchAndMergeNetworkConfigs,
  type DerivedAccountInfo,
} from '@salmon/shared';
import {
  ScreenHeader, PrimaryButton, SecondaryButton,
  DerivedAccountCard, DerivedAccountCardSkeleton,
} from '@salmon/ui';
import { useAuthFlow } from './AuthFlowContext';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: colors.background.primary,
});

const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: `0 ${spacing['2xl']}px`,
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: ms(fontSize['2xl']),
  textAlign: 'center',
  marginBottom: vs(spacing.md),
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: ms(fontSize.base),
  textAlign: 'center',
  marginBottom: vs(spacing['2xl']),
});

const ListContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  marginBottom: vs(spacing.lg),
});

const ButtonContainer = styled(Box)({
  width: '100%',
  paddingBottom: vs(spacing['3xl']),
  display: 'flex',
  flexDirection: 'column',
  gap: vs(spacing.md),
});

export function DerivedAccountsPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mnemonic, reset } = useAuthFlow();

  const [accounts, setAccounts] = useState<DerivedAccountInfo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchAndMergeNetworkConfigs();
        const results = await scanDerivedAccounts(mnemonic, [...SCAN_NETWORKS]);
        if (!cancelled) {
          setAccounts(results);
          // Auto-select accounts that were pre-selected by the scanner
          const active = new Set(
            results
              .filter((a) => a.selected || a.balance > 0)
              .map((_, i) => i),
          );
          setSelected(active);
        }
      } catch (err) {
        console.error('Scan failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mnemonic]);

  const toggleAccount = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    // TODO: Wire up derived account import via actions.editAccount
    // once the active account context is available post-creation.
    // For now, skip import and proceed.
    console.warn('Derived account import not yet wired for web');
    reset();
    navigate('/home', { replace: true });
  }, [navigate, reset]);

  const handleSkip = useCallback(() => {
    reset();
    navigate('/home', { replace: true });
  }, [navigate, reset]);

  return (
    <Container>
      <ScreenHeader onBack={() => navigate('/auth/success')} />
      <Content>
        <Title>{t('wallet.create.derived_accounts_title', 'Derived Accounts')}</Title>
        <Subtitle>
          {t('wallet.create.derived_accounts_body', 'We found additional accounts. Select which to import.')}
        </Subtitle>

        <ListContainer>
          {loading
            ? Array.from({ length: 3 }, (_, i) => <DerivedAccountCardSkeleton key={i} />)
            : accounts.map((acc, idx) => (
                <DerivedAccountCard
                  key={`${acc.networkId}-${acc.index}`}
                  address={acc.address}
                  networkName={acc.networkName}
                  path={acc.path}
                  balanceFormatted={acc.balanceFormatted}
                  selected={selected.has(idx)}
                  dimmed={!selected.has(idx)}
                  onToggle={() => toggleAccount(idx)}
                />
              ))}
        </ListContainer>

        <ButtonContainer>
          {accounts.length > 0 && (
            <PrimaryButton onClick={handleImport} disabled={selected.size === 0}>
              {`${t('actions.import', 'IMPORT SELECTED')} (${selected.size})`.toUpperCase()}
            </PrimaryButton>
          )}
          <SecondaryButton onClick={handleSkip}>
            {accounts.length > 0
              ? t('actions.skip', 'SKIP').toUpperCase()
              : t('actions.continue', 'CONTINUE').toUpperCase()}
          </SecondaryButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
}
