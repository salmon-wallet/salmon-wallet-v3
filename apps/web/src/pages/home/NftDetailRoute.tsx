import React, { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  colors,
  fontFamily,
  fontSize,
  spacing,
  useAccountsContext,
  isSolanaNft,
  isSolanaAccount,
  createBurnTransaction,
  type NftData,
} from '@salmon/shared';
import { NftDetailPage, NftSendDialog, ConfirmDialog } from '@salmon/ui';

export function NftDetailRoute(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const nft = location.state as NftData | null;

  const [state] = useAccountsContext();
  const { activeBlockchainAccount } = state;

  const [nftSendVisible, setNftSendVisible] = useState(false);
  const [burnConfirmVisible, setBurnConfirmVisible] = useState(false);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleSendPress = useCallback(() => {
    setNftSendVisible(true);
  }, []);

  const handleBurnPress = useCallback(() => {
    if (nft && isSolanaNft(nft)) {
      setBurnConfirmVisible(true);
    }
  }, [nft]);

  const confirmBurnNft = useCallback(async () => {
    if (!nft || !isSolanaNft(nft) || !activeBlockchainAccount || !isSolanaAccount(activeBlockchainAccount)) return;

    try {
      const ownerAddress = activeBlockchainAccount.getReceiveAddress();

      const txResponse = await createBurnTransaction({
        mintAddress: nft.mint,
        ownerAddress,
      });

      // Dynamic import — module resolved at runtime via shared's dependency
      // Use variable to prevent TS module resolution at compile time
      const solanaWeb3Module = '@solana/web3.js';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const web3: any = await import(/* @vite-ignore */ solanaWeb3Module);
      const txBytes = Buffer.from(txResponse.transaction, 'base64');
      const tx = web3.VersionedTransaction.deserialize(txBytes);
      const connection = await activeBlockchainAccount.getConnection();
      tx.sign([activeBlockchainAccount.keyPair]);
      await (connection as any).sendRawTransaction(tx.serialize());

      setBurnConfirmVisible(false);
      navigate('/home');
    } catch (err) {
      console.error('Failed to burn NFT:', err);
    }
  }, [nft, activeBlockchainAccount, navigate]);

  const handleSendSuccess = useCallback(() => {
    setNftSendVisible(false);
    navigate('/home');
  }, [navigate]);

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
          fontFamily: `${fontFamily.sans}, sans-serif`,
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
            fontFamily: `${fontFamily.sans}, sans-serif`,
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
      />
      <NftSendDialog
        visible={nftSendVisible}
        onClose={() => setNftSendVisible(false)}
        nft={nft}
        account={activeBlockchainAccount}
        onSuccess={handleSendSuccess}
      />
      <ConfirmDialog
        visible={burnConfirmVisible}
        onClose={() => setBurnConfirmVisible(false)}
        title="Burn NFT"
        message="Are you sure you want to burn this NFT? This action cannot be undone."
        confirmText="Burn"
        isDanger
        onConfirm={confirmBurnNft}
      />
    </>
  );
}
