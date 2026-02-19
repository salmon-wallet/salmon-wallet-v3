/**
 * DAppConnectPage - Connection approval UI for Solana dApps
 *
 * Shown when a dApp requests wallet connection and the user must approve.
 * Displays the requesting origin and Approve/Deny buttons.
 */
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  PrimaryButton,
  SecondaryButton,
} from '../../components';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
} from '@salmon/shared';

// ============================================================================
// Types
// ============================================================================

export interface DAppConnectRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

interface DAppConnectPageProps {
  origin: string;
  request: DAppConnectRequest;
  address: string;
  networkId: string | null;
  onApprove: (origin: string) => Promise<void>;
  onDeny: () => void;
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

const Content = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
});

const LogoImage = styled('img')({
  width: 64,
  height: 64,
  objectFit: 'contain',
  marginBottom: spacing['2xl'],
});

const Title = styled(Typography)({
  fontSize: fontSize['2xl'],
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  textAlign: 'center',
  marginBottom: spacing.sm,
});

const Subtitle = styled(Typography)({
  fontSize: fontSize.md,
  color: colors.text.secondary,
  textAlign: 'center',
  marginBottom: spacing['2xl'],
});

const OriginBox = styled(Box)({
  width: '100%',
  padding: spacing.lg,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 12,
  marginBottom: spacing['2xl'],
});

const OriginLabel = styled(Typography)({
  fontSize: fontSize.xs,
  color: colors.text.secondary,
  marginBottom: spacing.xs,
});

const OriginText = styled(Typography)({
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  color: colors.text.primary,
  wordBreak: 'break-all',
});

const AddressText = styled(Typography)({
  fontSize: fontSize.sm,
  color: colors.text.secondary,
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  marginTop: spacing.md,
});

const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
});

// ============================================================================
// Helpers
// ============================================================================

function formatOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname || origin;
  } catch {
    return origin;
  }
}

// ============================================================================
// Component
// ============================================================================

export function DAppConnectPage({
  origin,
  request,
  address,
  networkId,
  onApprove,
  onDeny,
}: DAppConnectPageProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      await onApprove(origin);
      // Send response to background
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          channel: 'salmon_extension_background_channel',
          data: {
            method: 'connected',
            params: { publicKey: address },
            id: request.id,
          },
        });
      }
      window.close();
    } catch (err) {
      console.error('[Salmon] DApp connect approve failed:', err);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          channel: 'salmon_extension_background_channel',
          data: {
            error: 'Failed to approve connection',
            id: request.id,
          },
        });
      }
      window.close();
    } finally {
      setLoading(false);
    }
  }, [origin, address, request.id, onApprove]);

  const handleDeny = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        channel: 'salmon_extension_background_channel',
        data: {
          error: 'User rejected the request',
          id: request.id,
        },
      });
    }
    onDeny();
    window.close();
  }, [request.id, onDeny]);

  const displayOrigin = formatOrigin(origin);
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';

  return (
    <Container>
      <Content>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Title>{t('dapp.connect_title', 'Connect to dApp')}</Title>
        <Subtitle>
          {t('dapp.connect_subtitle', 'This site wants to connect to your Salmon wallet')}
        </Subtitle>

        <OriginBox>
          <OriginLabel>{t('dapp.requesting_site', 'Requesting site')}</OriginLabel>
          <OriginText>{displayOrigin}</OriginText>
          {address && (
            <AddressText>
              {t('dapp.wallet_address', 'Wallet')}: {shortAddress}
            </AddressText>
          )}
        </OriginBox>

        <ButtonsContainer>
          <PrimaryButton onClick={handleApprove} loading={loading} disabled={!address || !networkId}>
            {t('dapp.approve', 'Approve').toUpperCase()}
          </PrimaryButton>
          <SecondaryButton onClick={handleDeny} disabled={loading}>
            {t('dapp.deny', 'Deny').toUpperCase()}
          </SecondaryButton>
        </ButtonsContainer>
      </Content>
    </Container>
  );
}

export default DAppConnectPage;
