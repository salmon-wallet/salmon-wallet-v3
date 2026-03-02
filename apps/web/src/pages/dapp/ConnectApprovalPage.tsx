import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, useAccountsContext } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '@salmon/ui';
import { onRequest, sendResponse, type BridgeRequest } from '../../utils/walletBridge';
import { isValidOrigin } from '../../utils/originValidation';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: colors.background.primary,
  padding: spacing['2xl'],
});

const CenterContent = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xl,
});

const Title = styled(Typography)({
  color: colors.text.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontWeight: 700,
  fontSize: 24,
  textAlign: 'center',
});

const Origin = styled(Typography)({
  color: colors.accent.primary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 16,
  textAlign: 'center',
  wordBreak: 'break-all',
});

const Description = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 14,
  textAlign: 'center',
  lineHeight: '22px',
});

const ButtonsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export function ConnectApprovalPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || '';
  const origin = searchParams.get('origin') || '';
  const [state] = useAccountsContext();
  const [request, setRequest] = useState<BridgeRequest | null>(null);

  useEffect(() => {
    const unsub = onRequest((req) => {
      if (req.requestId === requestId) setRequest(req);
    });
    return unsub;
  }, [requestId]);

  const handleApprove = useCallback(() => {
    const solanaAccount = state.activeAccount?.networksAccounts?.['solana-mainnet']?.[0];
    const publicKey = solanaAccount ? solanaAccount.getReceiveAddress() : '';
    sendResponse({
      requestId,
      approved: true,
      payload: { publicKey },
    });
    window.close();
  }, [requestId, state.activeAccount]);

  const handleReject = useCallback(() => {
    sendResponse({ requestId, approved: false });
    window.close();
  }, [requestId]);

  const validOrigin = isValidOrigin(origin);

  return (
    <Container>
      <CenterContent>
        <Title>Connect to App</Title>
        <Origin>{origin}</Origin>
        {!validOrigin && (
          <Description sx={{ color: colors.status.error }}>
            Warning: This origin does not use HTTPS.
          </Description>
        )}
        <Description>
          This app wants to connect to your Salmon wallet. It will be able to view your public
          address but cannot make transactions without your approval.
        </Description>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={handleApprove}>Approve</PrimaryButton>
        <SecondaryButton onClick={handleReject}>Reject</SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}
