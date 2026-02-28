import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '@salmon/ui';
import { onRequest, sendResponse, type BridgeRequest } from '../../utils/walletBridge';

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
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
  fontSize: 14,
  textAlign: 'center',
  wordBreak: 'break-all',
});

const InfoBox = styled(Box)({
  width: '100%',
  backgroundColor: colors.background.card,
  borderRadius: 12,
  padding: spacing.lg,
  border: `1px solid ${colors.border.default}`,
});

const InfoRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing.sm}px 0`,
  borderBottom: `1px solid ${colors.border.default}`,
  '&:last-child': { borderBottom: 'none' },
});

const InfoLabel = styled(Typography)({
  color: colors.text.secondary,
  fontFamily: `${fontFamily.sans}, sans-serif`,
  fontSize: 13,
});

const InfoValue = styled(Typography)({
  color: colors.text.primary,
  fontFamily: 'monospace',
  fontSize: 13,
});

const ButtonsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export function SignTransactionApprovalPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId') || '';
  const origin = searchParams.get('origin') || '';
  const [request, setRequest] = useState<BridgeRequest | null>(null);

  useEffect(() => {
    const unsub = onRequest((req) => {
      if (req.requestId === requestId) setRequest(req);
    });
    return unsub;
  }, [requestId]);

  const txBytes = request?.payload
    ? (request.payload as { transaction: number[] }).transaction
    : null;
  const txSize = txBytes ? txBytes.length : 0;

  const handleApprove = useCallback(async () => {
    // TODO: Sign the transaction with the active account's private key
    // For now, send a placeholder response
    sendResponse({
      requestId,
      approved: true,
      payload: { signedTransaction: txBytes || [] },
    });
    window.close();
  }, [requestId, txBytes]);

  const handleReject = useCallback(() => {
    sendResponse({ requestId, approved: false });
    window.close();
  }, [requestId]);

  return (
    <Container>
      <CenterContent>
        <Title>Approve Transaction</Title>
        <Origin>{origin}</Origin>

        <InfoBox>
          <InfoRow>
            <InfoLabel>Transaction size</InfoLabel>
            <InfoValue>{txSize} bytes</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>{request ? 'Ready to sign' : 'Waiting for data...'}</InfoValue>
          </InfoRow>
        </InfoBox>

        <Typography sx={{ color: colors.text.secondary, fontFamily: `${fontFamily.sans}, sans-serif`, fontSize: 14, textAlign: 'center' }}>
          This app is requesting you to sign and submit a transaction. Make sure you trust this app
          before approving.
        </Typography>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={handleApprove} disabled={!request}>Approve & Sign</PrimaryButton>
        <SecondaryButton onClick={handleReject}>Reject</SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}
