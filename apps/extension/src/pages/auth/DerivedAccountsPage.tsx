/**
 * DerivedAccountsPage - Search and import derived accounts across all networks
 *
 * BIP-44 gap scanning across Solana, Bitcoin, and Ethereum networks.
 * Mirrors mobile derived-accounts.tsx for the extension.
 */
import { useCallback, useEffect, useState } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {
  colors,
  spacing,
  fontFamily,
  deriveBlockchainAccount,
  getShortAddress,
  useAccountsContext,
  fetchAndMergeNetworkConfigs,
  SCAN_NETWORKS,
  scanDerivedAccounts,
  getMirrorNetworkId,
  type DerivedAccountInfo,
  type BlockchainAccount,
} from '@salmon/shared';
import {
  ScreenHeader,
  PrimaryButton,
  SecondaryButton,
  DerivedAccountCard,
  DerivedAccountCardSkeleton,
} from '../../components';

// ============================================================================
// Types
// ============================================================================

interface DerivedAccountsPageProps {
  onComplete: () => void;
  onBack: () => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: colors.background.primary,
});

const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `0 ${spacing['2xl']}px`,
});

const LogoImage = styled('img')({
  width: 48,
  height: 48,
  objectFit: 'contain',
  marginBottom: spacing.lg,
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '32px',
  marginBottom: spacing.sm,
  textAlign: 'center',
});

const Subtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
  lineHeight: '20px',
  marginBottom: spacing['2xl'],
  textAlign: 'center',
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const LoadingContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: spacing['3xl'],
});

const LoadingText = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  marginTop: spacing.lg,
  marginBottom: spacing['2xl'],
});

const EmptyContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const EmptyTitle = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  marginTop: spacing.lg,
  textAlign: 'center',
});

const EmptySubtitle = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
  marginTop: spacing.sm,
  textAlign: 'center',
  paddingLeft: spacing['2xl'],
  paddingRight: spacing['2xl'],
});

const AccountsContainer = styled(Box)({
  flex: 1,
  width: '100%',
  overflowY: 'auto',
});

const FoundText = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
  marginBottom: spacing.lg,
  textAlign: 'center',
});

const ButtonContainer = styled(Box)({
  width: '100%',
  paddingTop: spacing.lg,
  paddingBottom: spacing['2xl'],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

// ============================================================================
// Component
// ============================================================================

export function DerivedAccountsPage({ onComplete, onBack }: DerivedAccountsPageProps) {
  const [{ activeAccount }, actions] = useAccountsContext();

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<DerivedAccountInfo[]>([]);

  const mnemonic = activeAccount?.mnemonic;

  useEffect(() => {
    let cancelled = false;

    const searchDerivedAccounts = async () => {
      if (!mnemonic || !activeAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch and merge real RPC URLs from the backend before scanning.
      // Without this, the scan would use hardcoded public fallback URLs
      // that are rate-limited (Solana 403, Ethereum 429).
      await fetchAndMergeNetworkConfigs();

      if (cancelled) return;

      const networkIds = Object.keys(activeAccount.networksAccounts)
        .filter((id) => SCAN_NETWORKS.includes(id));

      const results = await scanDerivedAccounts(
        mnemonic,
        networkIds,
        undefined,
        () => cancelled,
      );

      if (!cancelled) {
        setAccounts(results);
        setLoading(false);
      }
    };

    searchDerivedAccounts();
    return () => { cancelled = true; };
  }, [mnemonic, activeAccount]);

  const handleToggleAccount = useCallback((key: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        `${acc.networkId}-${acc.index}` === key ? { ...acc, selected: !acc.selected } : acc,
      ),
    );
  }, []);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleImport = useCallback(async () => {
    if (!activeAccount || !mnemonic) return;

    const selectedAccounts = accounts.filter((acc) => acc.selected);
    if (selectedAccounts.length === 0) {
      handleSkip();
      return;
    }

    setImporting(true);

    try {
      const newDerivedAccounts: BlockchainAccount[] = [];

      for (const acc of selectedAccounts) {
        newDerivedAccounts.push(acc.account);

        const mirrorNetworkId = getMirrorNetworkId(acc.networkId);
        if (mirrorNetworkId && activeAccount.networksAccounts[mirrorNetworkId]) {
          try {
            const mirrorAccount = await deriveBlockchainAccount(
              mnemonic,
              mirrorNetworkId,
              acc.index,
            );
            newDerivedAccounts.push(mirrorAccount);
          } catch {
            // Mirror derivation failed
          }
        }
      }

      await actions.editAccount(activeAccount.id, {
        newDerivedAccounts,
      });

      onComplete();
    } catch (error) {
      console.error('Failed to import derived accounts:', error);
      onComplete();
    } finally {
      setImporting(false);
    }
  }, [accounts, activeAccount, actions, handleSkip, mnemonic, onComplete]);

  const selectedCount = accounts.filter((acc) => acc.selected).length;

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <CircularProgress sx={{ color: colors.accent.primary }} />
          <LoadingText>Searching for accounts...</LoadingText>
          <Box sx={{ width: '100%' }}>
            <DerivedAccountCardSkeleton />
            <DerivedAccountCardSkeleton />
            <DerivedAccountCardSkeleton />
          </Box>
        </LoadingContainer>
      );
    }

    if (accounts.length === 0) {
      return (
        <EmptyContainer>
          <EmptyTitle>No Derived Accounts Found</EmptyTitle>
          <EmptySubtitle>
            Could not derive additional accounts from your seed phrase.
          </EmptySubtitle>
        </EmptyContainer>
      );
    }

    return (
      <AccountsContainer>
        <FoundText>
          Found {accounts.length} derived account{accounts.length !== 1 ? 's' : ''}
        </FoundText>
        {accounts.map((acc) => {
          const key = `${acc.networkId}-${acc.index}`;
          return (
            <DerivedAccountCard
              key={key}
              address={getShortAddress(acc.address, 6) ?? acc.address}
              networkName={acc.networkName}
              path={acc.path}
              balanceFormatted={acc.balanceFormatted}
              selected={acc.selected}
              dimmed={acc.balance === 0}
              onToggle={() => handleToggleAccount(key)}
            />
          );
        })}
      </AccountsContainer>
    );
  };

  return (
    <Container>
      <ScreenHeader
        onBack={onBack}
        backDisabled={loading || importing}
      />
      <Content>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>Derived Accounts</Title>
        <Subtitle>
          Search for additional accounts derived from your seed phrase.
        </Subtitle>

        {renderContent()}

        <ButtonContainer>
          {accounts.length > 0 && (
            <PrimaryButton
              onClick={handleImport}
              disabled={loading || importing}
              loading={importing}
            >
              {`IMPORT SELECTED (${selectedCount})`}
            </PrimaryButton>
          )}
          <SecondaryButton
            onClick={handleSkip}
            disabled={importing}
          >
            {accounts.length === 0 ? 'CONTINUE' : 'SKIP'}
          </SecondaryButton>
        </ButtonContainer>
      </Content>
    </Container>
  );
}
