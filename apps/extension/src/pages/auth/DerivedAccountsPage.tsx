/**
 * DerivedAccountsPage - Search and import derived accounts across all networks
 *
 * BIP-44 gap scanning across Solana, Bitcoin, and Ethereum networks.
 * Mirrors mobile derived-accounts.tsx for the extension.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  SATOSHIS_PER_BTC,
  SolanaAccount,
  BitcoinAccount,
  WEI_PER_ETH_BIGINT,
  ethereum,
  useAccountsContext,
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
// Constants
// ============================================================================

const GAP_LIMIT = 20;

const SCAN_NETWORKS = [
  'solana-mainnet',
  'bitcoin-mainnet',
  'bitcoin-testnet',
  'ethereum-mainnet',
];

const MIRROR_NETWORKS: Record<string, string> = {
  'solana-mainnet': 'solana-devnet',
  'ethereum-mainnet': 'ethereum-sepolia',
};

const NETWORK_DISPLAY: Record<string, { symbol: string; name: string; blockchain: string }> = {
  'solana-mainnet': { symbol: 'SOL', name: 'Solana', blockchain: 'solana' },
  'solana-devnet': { symbol: 'SOL', name: 'Solana Devnet', blockchain: 'solana' },
  'bitcoin-mainnet': { symbol: 'BTC', name: 'Bitcoin', blockchain: 'bitcoin' },
  'bitcoin-testnet': { symbol: 'BTC', name: 'Bitcoin Testnet', blockchain: 'bitcoin' },
  'ethereum-mainnet': { symbol: 'ETH', name: 'Ethereum', blockchain: 'ethereum' },
  'ethereum-sepolia': { symbol: 'ETH', name: 'Ethereum Sepolia', blockchain: 'ethereum' },
};

// ============================================================================
// Types
// ============================================================================

interface DerivedAccountInfo {
  account: BlockchainAccount;
  address: string;
  path: string;
  index: number;
  networkId: string;
  networkName: string;
  balance: number;
  balanceFormatted: string;
  currencySymbol: string;
  selected: boolean;
}

interface DerivedAccountsPageProps {
  onComplete: () => void;
  onBack: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

async function getAccountBalance(
  account: BlockchainAccount,
  networkId: string,
): Promise<number> {
  const info = NETWORK_DISPLAY[networkId];
  if (!info) return 0;

  try {
    if (info.blockchain === 'solana') {
      const balanceInfo = await (account as SolanaAccount).getBalance();
      return balanceInfo.sol;
    }
    if (info.blockchain === 'bitcoin') {
      const satoshis = await (account as BitcoinAccount).getCredit();
      return satoshis / SATOSHIS_PER_BTC;
    }
    if (info.blockchain === 'ethereum') {
      const wei = await (account as ethereum.EthereumAccount).getCredit();
      return Number(wei) / Number(WEI_PER_ETH_BIGINT);
    }
  } catch {
    // RPC error
  }

  return 0;
}

function formatBalance(balance: number, symbol: string): string {
  if (balance === 0) return `0 ${symbol}`;
  if (balance < 0.0001) return `<0.0001 ${symbol}`;
  return `${balance.toFixed(4)} ${symbol}`;
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
  const { t } = useTranslation();
  const [{ activeAccount }, actions] = useAccountsContext();

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<DerivedAccountInfo[]>([]);

  const mnemonic = activeAccount?.mnemonic;

  useEffect(() => {
    const searchDerivedAccounts = async () => {
      if (!mnemonic || !activeAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const networkIds = Object.keys(activeAccount.networksAccounts)
        .filter((id) => SCAN_NETWORKS.includes(id));

      const allResults = await Promise.all(
        networkIds.map(async (networkId) => {
          const networkAccounts: DerivedAccountInfo[] = [];
          const info = NETWORK_DISPLAY[networkId] ?? {
            symbol: '?',
            name: networkId,
            blockchain: 'unknown',
          };
          let consecutiveEmpty = 0;
          let index = 1;

          while (consecutiveEmpty < GAP_LIMIT) {
            await new Promise((resolve) => setTimeout(resolve, 1));

            try {
              const account = await deriveBlockchainAccount(mnemonic, networkId, index);
              const address = account.getReceiveAddress();
              const balance = await getAccountBalance(account, networkId);

              const isFirstIndex = index === 1;
              const hasFunds = balance > 0;

              if (hasFunds) {
                consecutiveEmpty = 0;
              } else {
                consecutiveEmpty++;
              }

              if (isFirstIndex || hasFunds) {
                networkAccounts.push({
                  account,
                  address,
                  path: account.path,
                  index,
                  networkId,
                  networkName: info.name,
                  balance,
                  balanceFormatted: formatBalance(balance, info.symbol),
                  currencySymbol: info.symbol,
                  selected: hasFunds || isFirstIndex,
                });
              }
            } catch (error) {
              console.warn(`Error deriving ${networkId} index ${index}:`, error);
              consecutiveEmpty++;
            }

            index++;
          }

          return networkAccounts;
        }),
      );

      setAccounts(allResults.flat());
      setLoading(false);
    };

    searchDerivedAccounts();
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

        const mirrorNetworkId = MIRROR_NETWORKS[acc.networkId];
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
