import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { styled } from '@salmon/ui';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors, spacing, fontFamily, useAccountsContext } from '@salmon/shared';
import { PrimaryButton, SecondaryButton } from '@salmon/ui';
import { onRequest, sendResponse, type BridgeRequest } from '../../utils/walletBridge';

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
  fontSize: 14,
  textAlign: 'center',
  wordBreak: 'break-all',
});

const MessageBox = styled(Box)({
  width: '100%',
  maxHeight: 200,
  overflowY: 'auto',
  backgroundColor: colors.background.card,
  borderRadius: 12,
  padding: spacing.lg,
  border: `1px solid ${colors.border.default}`,
});

const MessageText = styled(Typography)({
  color: colors.text.primary,
  fontFamily: 'monospace',
  fontSize: 13,
  wordBreak: 'break-all',
  whiteSpace: 'pre-wrap',
});

const ButtonsContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  width: '100%',
});

export function SignMessageApprovalPage(): React.ReactElement {
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

  const messageBytes = request?.payload
    ? new Uint8Array((request.payload as { message: number[] }).message)
    : null;
  const messageText = messageBytes ? new TextDecoder().decode(messageBytes) : '';

  const handleApprove = useCallback(async () => {
    // TODO: Sign the message with the active account's private key
    // For now, send a placeholder response
    sendResponse({
      requestId,
      approved: true,
      payload: { signature: [] },
    });
    window.close();
  }, [requestId]);

  const handleReject = useCallback(() => {
    sendResponse({ requestId, approved: false });
    window.close();
  }, [requestId]);

  return (
    <Container>
      <CenterContent>
        <Title>Sign Message</Title>
        <Origin>{origin}</Origin>

        {messageText && (
          <MessageBox>
            <MessageText>{messageText}</MessageText>
          </MessageBox>
        )}

        <Typography sx={{ color: colors.text.secondary, fontFamily: `${fontFamily.sans}, sans-serif`, fontSize: 14, textAlign: 'center' }}>
          This app is requesting you to sign a message. This will not submit a transaction.
        </Typography>
      </CenterContent>

      <ButtonsContainer>
        <PrimaryButton onClick={handleApprove}>Sign</PrimaryButton>
        <SecondaryButton onClick={handleReject}>Reject</SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}
