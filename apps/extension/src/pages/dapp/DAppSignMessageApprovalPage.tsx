/**
 * DAppSignMessageApprovalPage - Message signing approval UI for Solana dApps
 *
 * Shown when a dApp requests signing an arbitrary message via the `sign` method.
 * Displays origin, decoded message (UTF-8 or hex fallback), and Approve/Deny.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { styled } from '../../utils/styled';
import { PrimaryButton, SecondaryButton } from '../../components';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  isSolanaAccount,
  formatOrigin,
} from '@salmon/shared';
import type { BlockchainAccount } from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface DAppSignMessageRequest {
  id: string | number;
  method: string;
  params?: {
    data?: number[];
    [key: string]: unknown;
  };
}

interface Props {
  origin: string;
  request: DAppSignMessageRequest;
  account: BlockchainAccount | undefined;
  onDismiss: (approved: boolean) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function toHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')}`;
}

function decodeMessage(data: number[]): { text: string; isHex: boolean } {
  const bytes = Uint8Array.from(data);
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Check for control characters (except common whitespace)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(decoded)) {
      return { text: toHex(bytes), isHex: true };
    }
    return { text: decoded, isHex: false };
  } catch {
    return { text: toHex(bytes), isHex: true };
  }
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  padding: spacing['2xl'],
  background: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
  fontFamily: `${fontFamily.sans}, sans-serif`,
});

const Header = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.lg,
  marginBottom: spacing.xl,
});

const LogoImage = styled('img')({
  width: 40,
  height: 40,
  objectFit: 'contain',
});

const Title = styled(Typography)({
  fontSize: fontSize.xl,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
});

const Subtitle = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.secondary,
  marginTop: 2,
});

const Card = styled(Box)({
  width: '100%',
  padding: spacing.lg,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 12,
  marginTop: spacing.lg,
});

const Row = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing.lg,
  alignItems: 'flex-start',
  marginTop: spacing.md,
});

const Label = styled(Typography)({
  fontSize: fontSize.xs,
  color: colors.text.secondary,
});

const Value = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.primary,
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  textAlign: 'right',
  flex: 1,
});

const MessageBox = styled(Box)({
  width: '100%',
  padding: spacing.lg,
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 8,
  marginTop: spacing.md,
  maxHeight: 200,
  overflowY: 'auto',
});

const MessageText = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.primary,
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  whiteSpace: 'pre-wrap',
});

const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  marginTop: spacing['2xl'],
});

// ============================================================================
// Component
// ============================================================================

export function DAppSignMessageApprovalPage({ origin, request, account, onDismiss }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const displayOrigin = useMemo(() => formatOrigin(origin), [origin]);

  const messageData = useMemo(() => {
    const data = request.params?.data;
    if (!data || !Array.isArray(data)) {
      return null;
    }
    return decodeMessage(data);
  }, [request.params?.data]);

  const sendToBackground = useCallback(
    (data: Record<string, unknown>) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          channel: 'salmon_extension_background_channel',
          data: {
            ...data,
            id: request.id,
          },
        });
      }
    },
    [request.id]
  );

  const handleDeny = useCallback(() => {
    sendToBackground({ error: 'User rejected the request' });
    onDismiss(false);
  }, [sendToBackground, onDismiss]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      if (!account || !isSolanaAccount(account)) {
        throw new Error('Solana account not available');
      }

      const data = request.params?.data;
      if (!data || !Array.isArray(data)) {
        throw new Error('Missing message data');
      }

      const messageBytes = Uint8Array.from(data);
      const signature = nacl.sign.detached(messageBytes, account.keyPair.secretKey);
      const publicKey = account.getReceiveAddress();

      sendToBackground({
        result: {
          signature: bs58.encode(signature),
          publicKey,
        },
      });
      onDismiss(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Message signing failed';
      sendToBackground({ error: msg });
      onDismiss(false);
    } finally {
      setLoading(false);
    }
  }, [account, request.params, sendToBackground, onDismiss]);

  return (
    <Container>
      <Header>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Box>
          <Title>{t('dapp.sign_message_title', 'Sign Message')}</Title>
          <Subtitle>{displayOrigin}</Subtitle>
        </Box>
      </Header>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Card>
        <Row>
          <Label>{t('dapp.requesting_site', 'Requesting site')}</Label>
          <Value>{displayOrigin}</Value>
        </Row>
      </Card>

      {messageData && (
        <>
          <Label sx={{ marginTop: spacing.lg }}>
            {messageData.isHex
              ? t('dapp.hex_message_label', 'Message (hex)')
              : t('dapp.message_label', 'Message')}
          </Label>
          <MessageBox>
            <MessageText>{messageData.text}</MessageText>
          </MessageBox>
        </>
      )}

      {!messageData && (
        <Card>
          <Typography sx={{ color: colors.text.secondary, fontSize: fontSize.xs }}>
            {t('general.error', 'Unexpected error')}: Missing message data
          </Typography>
        </Card>
      )}

      <ButtonsContainer>
        <PrimaryButton
          onClick={handleApprove}
          loading={loading}
          disabled={loading || !account || !messageData}
        >
          {t('actions.approve', 'Approve').toUpperCase()}
        </PrimaryButton>
        <SecondaryButton onClick={handleDeny} disabled={loading}>
          {t('actions.deny', 'Deny').toUpperCase()}
        </SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}

export default DAppSignMessageApprovalPage;
