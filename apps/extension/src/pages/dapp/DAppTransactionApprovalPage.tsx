/**
 * DAppTransactionApprovalPage - Transaction approval UI for Solana dApps
 *
 * Shown when a dApp requests signing/sending a Solana transaction.
 * Displays origin + basic decoded transaction metadata + Approve/Deny.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import bs58 from 'bs58';
import { Message, Transaction, VersionedMessage, VersionedTransaction } from '@solana/web3.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '../../utils/styled';
import { PrimaryButton, SecondaryButton } from '../../components';
import { colors, fontFamily, fontSize, fontWeight, spacing, isSolanaAccount, fetchAndMergeNetworkConfigs, formatOrigin } from '@salmon/shared';
import type { BlockchainAccount } from '@salmon/shared';

export interface DAppTransactionRequest {
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface Props {
  origin: string;
  request: DAppTransactionRequest;
  account: BlockchainAccount | undefined;
  networkId: string | null;
}

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

const ButtonsContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
  marginTop: spacing['2xl'],
});

type ParsedTransaction = 
  | { type: 'legacy'; message: Message; tx: Transaction }
  | { type: 'versioned'; message: VersionedMessage; tx: VersionedTransaction };

function buildTransactionFromEncodedMessage(encodedMessage: string): ParsedTransaction {
  const bytes = bs58.decode(encodedMessage);
  
  // Try to parse as versioned message first
  // The dApp sends only the serialized message, not the full transaction
  try {
    const versionedMessage = VersionedMessage.deserialize(bytes);
    const versionedTx = new VersionedTransaction(versionedMessage);
    return { type: 'versioned', message: versionedMessage, tx: versionedTx };
  } catch {
    // If that fails, try legacy transaction
    try {
      const message = Message.from(bytes);
      const tx = Transaction.populate(message);
      return { type: 'legacy', message, tx };
    } catch (error) {
      throw new Error(`Failed to parse transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

function requestHasMethod(request: DAppTransactionRequest, method: string): boolean {
  return request.method === method;
}

export function DAppTransactionApprovalPage({ origin, request, account, networkId }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [feeLamports, setFeeLamports] = useState<number | null>(null);
  const [instructionCount, setInstructionCount] = useState<number | null>(null);
  const [feePayer, setFeePayer] = useState<string | null>(null);
  const [recentBlockhash, setRecentBlockhash] = useState<string | null>(null);

  const isSupported = useMemo(() => {
    return (
      requestHasMethod(request, 'signTransaction') ||
      requestHasMethod(request, 'signAllTransactions') ||
      requestHasMethod(request, 'signAndSendTransaction')
    );
  }, [request]);

  const displayOrigin = useMemo(() => formatOrigin(origin), [origin]);

  const requestSummary = useMemo(() => {
    if (request.method === 'signAndSendTransaction') return 'signAndSendTransaction';
    if (request.method === 'signAllTransactions') return 'signAllTransactions';
    return 'signTransaction';
  }, [request.method]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setParsingError(null);
      setFeeLamports(null);
      setInstructionCount(null);
      setFeePayer(null);
      setRecentBlockhash(null);

      if (!isSupported) return;
      if (!account || !isSolanaAccount(account)) return;

      // Ensure network configs are up-to-date before using connection
      await fetchAndMergeNetworkConfigs();

      try {
        if (request.method === 'signAllTransactions') {
          const messages = (request.params?.messages as unknown) ?? null;
          if (!Array.isArray(messages) || messages.length === 0) {
            throw new Error('Missing messages');
          }
          const first = String(messages[0]);
          const parsed = buildTransactionFromEncodedMessage(first);
          if (cancelled) return;
          
          if (parsed.type === 'legacy') {
            setInstructionCount(parsed.message.instructions.length);
            setFeePayer(parsed.message.accountKeys?.[0]?.toBase58?.() ?? null);
            setRecentBlockhash(parsed.message.recentBlockhash ?? null);
            const connection = await account.getConnection();
            const fee = await connection.getFeeForMessage(parsed.message);
            if (cancelled) return;
            setFeeLamports(fee.value ?? null);
          } else {
            // Versioned transaction
            setInstructionCount(parsed.message.compiledInstructions.length);
            const staticAccountKeys = parsed.message.staticAccountKeys;
            setFeePayer(staticAccountKeys?.[0]?.toBase58?.() ?? null);
            // recentBlockhash is a Buffer in VersionedMessage
            const blockhash = parsed.message.recentBlockhash;
            setRecentBlockhash(blockhash ? Buffer.from(blockhash).toString('base64') : null);
            const connection = await account.getConnection();
            const fee = await connection.getFeeForMessage(parsed.message);
            if (cancelled) return;
            setFeeLamports(fee.value ?? null);
          }
        } else {
          const encoded = String(request.params?.message ?? '');
          if (!encoded) {
            throw new Error('Missing message');
          }
          const parsed = buildTransactionFromEncodedMessage(encoded);
          if (cancelled) return;
          
          if (parsed.type === 'legacy') {
            setInstructionCount(parsed.message.instructions.length);
            setFeePayer(parsed.message.accountKeys?.[0]?.toBase58?.() ?? null);
            setRecentBlockhash(parsed.message.recentBlockhash ?? null);
            const connection = await account.getConnection();
            const fee = await connection.getFeeForMessage(parsed.message);
            if (cancelled) return;
            setFeeLamports(fee.value ?? null);
          } else {
            // Versioned transaction
            setInstructionCount(parsed.message.compiledInstructions.length);
            const staticAccountKeys = parsed.message.staticAccountKeys;
            setFeePayer(staticAccountKeys?.[0]?.toBase58?.() ?? null);
            // recentBlockhash is a Buffer in VersionedMessage
            const blockhash = parsed.message.recentBlockhash;
            setRecentBlockhash(blockhash ? Buffer.from(blockhash).toString('base64') : null);
            const connection = await account.getConnection();
            const fee = await connection.getFeeForMessage(parsed.message);
            if (cancelled) return;
            setFeeLamports(fee.value ?? null);
          }
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to decode transaction';
        setParsingError(msg);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [account, isSupported, request.method, request.params]);

  const sendToBackground = useCallback((data: Record<string, unknown>) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        channel: 'salmon_extension_background_channel',
        data: {
          ...data,
          id: request.id,
        },
      });
    }
  }, [request.id]);

  const handleDeny = useCallback(() => {
    sendToBackground({ error: 'User rejected the request' });
    window.close();
  }, [sendToBackground]);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      if (!account || !isSolanaAccount(account)) {
        throw new Error('Solana account not available');
      }

      const publicKey = account.getReceiveAddress();

      if (request.method === 'signTransaction') {
        const encoded = String(request.params?.message ?? '');
        if (!encoded) throw new Error('Missing message');
        const parsed = buildTransactionFromEncodedMessage(encoded);
        
        if (parsed.type === 'legacy') {
          parsed.tx.partialSign(account.keyPair);
          if (!parsed.tx.signature) throw new Error('Failed to sign transaction');
          sendToBackground({
            result: {
              signature: bs58.encode(parsed.tx.signature),
              publicKey,
            },
          });
        } else {
          // Versioned transaction
          parsed.tx.sign([account.keyPair]);
          const signatures = parsed.tx.signatures;
          if (!signatures || signatures.length === 0) throw new Error('Failed to sign transaction');
          // For versioned transactions, signatures are in order of required signers
          // The first signature typically corresponds to the fee payer
          sendToBackground({
            result: {
              signature: bs58.encode(signatures[0]),
              publicKey,
            },
          });
        }
        window.close();
        return;
      }

      if (request.method === 'signAllTransactions') {
        const messages = (request.params?.messages as unknown) ?? null;
        if (!Array.isArray(messages) || messages.length === 0) {
          throw new Error('Missing messages');
        }
        const signatures = messages.map((m) => {
          const parsed = buildTransactionFromEncodedMessage(String(m));
          
          if (parsed.type === 'legacy') {
            parsed.tx.partialSign(account.keyPair);
            if (!parsed.tx.signature) throw new Error('Failed to sign one of the transactions');
            return bs58.encode(parsed.tx.signature);
          } else {
            // Versioned transaction
            parsed.tx.sign([account.keyPair]);
            const txSignatures = parsed.tx.signatures;
            if (!txSignatures || txSignatures.length === 0) {
              throw new Error('Failed to sign one of the transactions');
            }
            // For versioned transactions, signatures are in order of required signers
            // The first signature typically corresponds to the fee payer
            return bs58.encode(txSignatures[0]);
          }
        });
        sendToBackground({
          result: {
            signatures,
            publicKey,
          },
        });
        window.close();
        return;
      }

      if (request.method === 'signAndSendTransaction') {
        const encoded = String(request.params?.message ?? '');
        if (!encoded) throw new Error('Missing message');
        const parsed = buildTransactionFromEncodedMessage(encoded);
        // Ensure network configs are up-to-date before using connection
        await fetchAndMergeNetworkConfigs();
        const connection = await account.getConnection();
        const options = (request.params?.options as Record<string, unknown> | undefined) ?? undefined;
        
        if (parsed.type === 'legacy') {
          parsed.tx.partialSign(account.keyPair);
          const signature = await connection.sendRawTransaction(
            parsed.tx.serialize(),
            options as never
          );
          sendToBackground({ result: { signature } });
        } else {
          // Versioned transaction
          parsed.tx.sign([account.keyPair]);
          const signature = await connection.sendTransaction(parsed.tx, options as never);
          sendToBackground({ result: { signature } });
        }
        window.close();
        return;
      }

      throw new Error(`Unsupported method: ${request.method}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transaction approval failed';
      sendToBackground({ error: msg });
      window.close();
    } finally {
      setLoading(false);
    }
  }, [account, request.method, request.params, sendToBackground]);

  const feeSol = useMemo(() => {
    if (feeLamports == null) return null;
    return (feeLamports / 1_000_000_000).toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
  }, [feeLamports]);

  return (
    <Container>
      <Header>
        <LogoImage src="/images/Logo.png" alt="Salmon" />
        <Box>
          <Title>{t('adapter.detail.transaction.title', 'Transaction Review')}</Title>
          <Subtitle>
            {displayOrigin} · {requestSummary}
          </Subtitle>
        </Box>
      </Header>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Card>
        <Row>
          <Label>{t('dapp.requesting_site', 'Requesting site')}</Label>
          <Value>{displayOrigin}</Value>
        </Row>
        <Row>
          <Label>Network</Label>
          <Value>{networkId ?? 'unknown'}</Value>
        </Row>
        <Row>
          <Label>Fee payer</Label>
          <Value>{feePayer ?? (parsingError ? '—' : <CircularProgress size={14} />)}</Value>
        </Row>
        <Row>
          <Label>Recent blockhash</Label>
          <Value>{recentBlockhash ?? (parsingError ? '—' : <CircularProgress size={14} />)}</Value>
        </Row>
        <Row>
          <Label>Instructions</Label>
          <Value>
            {instructionCount != null ? String(instructionCount) : (parsingError ? '—' : <CircularProgress size={14} />)}
          </Value>
        </Row>
        <Row>
          <Label>{t('adapter.detail.transaction.fee', 'Network Fee')}</Label>
          <Value>
            {feeSol != null ? `${feeSol} SOL` : (parsingError ? '—' : <CircularProgress size={14} />)}
          </Value>
        </Row>
        {parsingError && (
          <Box sx={{ marginTop: spacing.lg }}>
            <Typography sx={{ color: colors.text.secondary, fontSize: fontSize.xs }}>
              {t('general.error', 'Unexpected error')}: {parsingError}
            </Typography>
          </Box>
        )}
        {!isSupported && (
          <Box sx={{ marginTop: spacing.lg }}>
            <Typography sx={{ color: colors.text.secondary, fontSize: fontSize.xs }}>
              {t('general.error', 'Unexpected error')}: Unsupported request method ({request.method})
            </Typography>
          </Box>
        )}
      </Card>

      <ButtonsContainer>
        <PrimaryButton onClick={handleApprove} loading={loading} disabled={loading || !isSupported || !account}>
          {t('actions.approve', 'Approve').toUpperCase()}
        </PrimaryButton>
        <SecondaryButton onClick={handleDeny} disabled={loading}>
          {t('actions.deny', 'Deny').toUpperCase()}
        </SecondaryButton>
      </ButtonsContainer>
    </Container>
  );
}

export default DAppTransactionApprovalPage;
