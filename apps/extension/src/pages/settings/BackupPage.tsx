/**
 * BackupPage - Backup options page for browser extension
 *
 * This page provides backup functionality for the wallet, including:
 * - Viewing the seed phrase (mnemonic)
 * - Viewing the private key
 * - Security warnings about protecting backup data
 *
 * The seed phrase/private key is revealed only after user confirmation
 * to prevent accidental exposure.
 */

import React, { useCallback, useState, useMemo } from 'react';
import { styled } from '../../utils/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import KeyIcon from '@mui/icons-material/Key';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, useAccounts } from '@salmon/shared';
import { SettingsPageLayout } from '@/components';

// ============================================================================
// Types
// ============================================================================

export interface BackupPageProps {
  /** Callback to navigate back to home */
  onBack: () => void;
}

// ============================================================================
// Styled Components
// ============================================================================

const PageContent = styled(Box)({
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
});

const WarningAlert = styled(Alert)({
  backgroundColor: 'rgba(255, 171, 0, 0.1)',
  border: `1px solid rgba(255, 171, 0, 0.3)`,
  '& .MuiAlert-icon': {
    color: '#FFAB00',
  },
  '& .MuiAlert-message': {
    color: colors.text.primary,
  },
});

const SeedPhraseCard = styled(Paper)({
  backgroundColor: colors.background.card,
  padding: spacing.lg,
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border.default}`,
  position: 'relative',
});

const SeedPhraseGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: spacing.sm,
});

const WordChip = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `${spacing.sm}px ${spacing.md}px`,
  backgroundColor: colors.background.primary,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
});

const WordNumber = styled(Typography)({
  fontSize: 11,
  fontWeight: 500,
  color: colors.text.secondary,
  minWidth: 16,
});

const WordText = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.primary,
  fontFamily: 'monospace',
});

const BlurOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(15, 15, 15, 0.95)',
  borderRadius: borderRadius.lg,
  gap: spacing.md,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
  },
});

const RevealText = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: colors.text.secondary,
});

const ActionRow = styled(Box)({
  display: 'flex',
  gap: spacing.sm,
  marginTop: spacing.md,
});

const ActionButton = styled(Button)({
  flex: 1,
  textTransform: 'none',
  fontWeight: 500,
  borderRadius: borderRadius.md,
});

const CopyButton = styled(ActionButton)({
  backgroundColor: colors.background.card,
  color: colors.text.primary,
  border: `1px solid ${colors.border.default}`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: colors.border.light,
  },
});

const SectionLabel = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: spacing.sm,
});

// ============================================================================
// Component
// ============================================================================

export function BackupPage({ onBack }: BackupPageProps): React.ReactElement {
  const { t } = useTranslation();
  const [state] = useAccounts();
  const { activeAccount } = state;

  const [seedPhraseVisible, setSeedPhraseVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get the mnemonic from the active account
  const mnemonic = useMemo(() => {
    return activeAccount?.mnemonic || '';
  }, [activeAccount]);

  const words = useMemo(() => {
    return mnemonic.split(' ').filter((w) => w.length > 0);
  }, [mnemonic]);

  const handleReveal = useCallback(() => {
    setSeedPhraseVisible(true);
  }, []);

  const handleHide = useCallback(() => {
    setSeedPhraseVisible(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (mnemonic) {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [mnemonic]);

  // If no mnemonic (imported via private key), show message
  const hasNoMnemonic = !mnemonic || words.length === 0;

  return (
    <SettingsPageLayout
      title={t('settings.backup', 'Backup Wallet')}
      onBack={onBack}
    >
      <PageContent>
        <WarningAlert
          severity="warning"
          icon={<WarningAmberIcon />}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t(
              'settings.backup_warning_title',
              'Never share your recovery phrase'
            )}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            {t(
              'settings.backup_warning_description',
              'Anyone with your recovery phrase can access your funds. Keep it stored securely and never enter it on websites.'
            )}
          </Typography>
        </WarningAlert>

        {hasNoMnemonic ? (
          <Alert severity="info" sx={{ backgroundColor: colors.background.card }}>
            <Typography variant="body2" color="text.primary">
              {t(
                'settings.no_seed_phrase',
                'This account was imported using a private key and does not have a recovery phrase.'
              )}
            </Typography>
          </Alert>
        ) : (
          <>
            <Box>
              <SectionLabel>
                {t('settings.recovery_phrase', 'Recovery Phrase')}
              </SectionLabel>
              <SeedPhraseCard>
                <SeedPhraseGrid>
                  {words.map((word, index) => (
                    <WordChip key={index}>
                      <WordNumber>{index + 1}.</WordNumber>
                      <WordText>
                        {seedPhraseVisible ? word : '****'}
                      </WordText>
                    </WordChip>
                  ))}
                </SeedPhraseGrid>

                {!seedPhraseVisible && (
                  <BlurOverlay onClick={handleReveal}>
                    <KeyIcon sx={{ fontSize: 40, color: colors.text.secondary }} />
                    <RevealText>
                      {t('settings.tap_to_reveal', 'Tap to reveal')}
                    </RevealText>
                  </BlurOverlay>
                )}
              </SeedPhraseCard>

              <ActionRow>
                <Tooltip title={copied ? t('actions.copied', 'Copied!') : ''} open={copied}>
                  <CopyButton
                    variant="outlined"
                    startIcon={copied ? <CheckIcon sx={{ color: colors.status.success }} /> : <ContentCopyIcon />}
                    onClick={handleCopy}
                    disabled={!seedPhraseVisible}
                  >
                    {copied ? t('actions.copied', 'Copied!') : t('actions.copy', 'Copy')}
                  </CopyButton>
                </Tooltip>
                <ActionButton
                  variant="outlined"
                  startIcon={seedPhraseVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={seedPhraseVisible ? handleHide : handleReveal}
                  sx={{
                    backgroundColor: seedPhraseVisible
                      ? colors.accent.primary
                      : colors.background.card,
                    color: seedPhraseVisible
                      ? '#FFFFFF'
                      : colors.text.primary,
                    border: `1px solid ${
                      seedPhraseVisible ? colors.accent.primary : colors.border.default
                    }`,
                    '&:hover': {
                      backgroundColor: seedPhraseVisible
                        ? '#FF7A64' // lighter shade of accent primary
                        : 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {seedPhraseVisible
                    ? t('actions.hide', 'Hide')
                    : t('actions.reveal', 'Reveal')}
                </ActionButton>
              </ActionRow>
            </Box>
          </>
        )}
      </PageContent>
    </SettingsPageLayout>
  );
}

export default BackupPage;
