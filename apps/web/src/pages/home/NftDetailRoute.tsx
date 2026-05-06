import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  fontFamily,
  fontSize,
  spacing,
  useAccountsContext,
  useInvalidateAfterTx,
  isSolanaNft,
  createBurnTransaction,
  signAndSendPreparedSolanaTransactions,
  type NftData,
} from '@salmon/shared';
import { isSolanaAccount } from '@salmon/shared/utils/account';
import { NftDetailPage, NftSendDialog } from '@salmon/ui';

export function NftDetailRoute(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const nft = location.state as NftData | null;

  const [state] = useAccountsContext();
  const { activeAccount } = state;
  const invalidateAfterTx = useInvalidateAfterTx();

  const [nftSendVisible, setNftSendVisible] = useState(false);
  const [burnStep, setBurnStep] = useState<'idle' | 'review' | 'success'>('idle');
  const [burnPreview, setBurnPreview] = useState<Awaited<ReturnType<typeof createBurnTransaction>> | null>(null);
  const [burnPreparing, setBurnPreparing] = useState(false);
  const [burnError, setBurnError] = useState<string | null>(null);

  const collectibleSolanaAccount = useMemo(() => {
    const networksAccounts = activeAccount?.networksAccounts;
    if (!networksAccounts) return undefined;

    const preferredNetworkIds = ['solana-mainnet', 'solana-devnet'] as const;
    for (const networkId of preferredNetworkIds) {
      const account = networksAccounts[networkId]?.[0];
      if (account && isSolanaAccount(account)) {
        return account;
      }
    }

    for (const accounts of Object.values(networksAccounts)) {
      for (const account of accounts ?? []) {
        if (account && isSolanaAccount(account)) {
          return account;
        }
      }
    }

    return undefined;
  }, [activeAccount]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleSendPress = useCallback(() => {
    setNftSendVisible(true);
  }, []);

  const handleBurnPress = useCallback(() => {
    if (!nft || !isSolanaNft(nft) || !collectibleSolanaAccount) return;

    setBurnStep('review');
    setBurnPreparing(true);
    setBurnPreview(null);
    setBurnError(null);

    const ownerAddress = collectibleSolanaAccount.getReceiveAddress();
    const solAccount = collectibleSolanaAccount;
    createBurnTransaction({
      mintAddress: nft.mint,
      ownerAddress,
    })
      .then(async (txResponse) => {
        setBurnPreview(txResponse);
        if (txResponse.lookupTable) {
          const balance = await solAccount.getCredit();
          if (balance < txResponse.lookupTable.estimatedRentLamports) {
            setBurnError('Insufficient SOL balance to cover burn transaction fees.');
          }
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Burn failed';
        setBurnError(message);
      })
      .finally(() => {
        setBurnPreparing(false);
      });
  }, [nft, collectibleSolanaAccount]);

  const handleBurnBack = useCallback(() => {
    setBurnStep('idle');
    setBurnPreparing(false);
    setBurnPreview(null);
    setBurnError(null);
  }, []);

  const confirmBurnNft = useCallback(async () => {
    if (!nft || !isSolanaNft(nft) || !collectibleSolanaAccount || !burnPreview) return;

    try {
      setBurnPreparing(true);
      setBurnError(null);
      await signAndSendPreparedSolanaTransactions(collectibleSolanaAccount, burnPreview);
      setBurnStep('success');
    } catch (err) {
      console.error('Failed to burn NFT:', err);
      setBurnError(err instanceof Error ? err.message : 'Burn failed');
    } finally {
      setBurnPreparing(false);
    }
  }, [nft, collectibleSolanaAccount, burnPreview]);

  const handleBurnSuccessContinue = useCallback(() => {
    handleBurnBack();
    invalidateAfterTx({
      kinds: ['balance', 'transactions', 'nfts', 'avatar-nfts'],
    }).catch(() => undefined);
    navigate('/home');
  }, [handleBurnBack, invalidateAfterTx, navigate]);

  const handleSendSuccess = useCallback(() => {
    setNftSendVisible(false);
    invalidateAfterTx({
      kinds: ['balance', 'transactions', 'nfts', 'avatar-nfts'],
    }).catch(() => undefined);
    navigate('/home');
  }, [invalidateAfterTx, navigate]);

  // Deep link fallback — no NFT data in location state
  if (!nft) {
    return (
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['2xl'],
      }}>
        <Typography sx={{
          color: colors.text.secondary,
          fontFamily: fontFamily.sans,
          fontSize: fontSize.lg,
          textAlign: 'center',
          marginBottom: spacing.md,
        }}>
          NFT not found. Please navigate from your collection.
        </Typography>
        <Typography
          component="a"
          onClick={() => navigate('/home')}
          sx={{
            color: colors.accent.primary,
            fontFamily: fontFamily.sans,
            fontSize: fontSize.md,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Go to Home
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <NftDetailPage
        nft={nft}
        onBack={handleBack}
        onSendPress={handleSendPress}
        onBurnPress={handleBurnPress}
        burnStep={burnStep}
        burnPreview={burnPreview}
        burnPreparing={burnPreparing}
        burnError={burnError}
        onBurnBack={handleBurnBack}
        onBurnConfirm={confirmBurnNft}
        onBurnSuccessContinue={handleBurnSuccessContinue}
      />
      <NftSendDialog
        visible={nftSendVisible}
        onClose={() => setNftSendVisible(false)}
        nft={nft}
        account={collectibleSolanaAccount}
        onSuccess={handleSendSuccess}
      />
    </>
  );
}
