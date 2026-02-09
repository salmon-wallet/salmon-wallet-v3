/**
 * ReceiveSheet - Dialog for receiving tokens (web/extension version)
 *
 * Migrated from packages/ui (React Native) to use MUI Dialog.
 * Features:
 * - QR code for wallet address
 * - Full address display (selectable)
 * - Copy address button
 * - ScalesBackground decorative pattern
 * - Responsive QR code sizing
 */

import React, { useCallback, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import {
  colors,
  spacing,
  borderRadius,
  copyToClipboard,
} from '@salmon/shared';
import { QRCode } from '../QRCode';
import { ScalesBackground } from '../ScalesBackground';
import type { ReceiveSheetProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const QR_SIZE = 220;
const QR_BORDER_WIDTH = 20;
const COPY_FEEDBACK_DURATION = 2000;

// ============================================================================
// Styled Components
// ============================================================================

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    backgroundColor: colors.dialog.background,
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.dialog.border}`,
    minWidth: 360,
    maxWidth: 400,
    overflow: 'hidden',
    position: 'relative',
  },
});

const StyledDialogTitle = styled(DialogTitle)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing.lg}px ${spacing.xl}px`,
  borderBottom: `1px solid ${colors.border.default}`,
  position: 'relative',
  zIndex: 1,
});

const TitleText = styled(Typography)({
  fontSize: 20,
  fontWeight: 800,
  color: colors.text.primary,
  letterSpacing: 0.24,
});

const CloseButton = styled(IconButton)({
  color: colors.text.secondary,
  padding: spacing.xs,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledDialogContent = styled(DialogContent)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${spacing.xl}px ${spacing.xl}px ${spacing['2xl']}px`,
  gap: spacing.xl,
  position: 'relative',
  zIndex: 1,
});

const BackgroundWrapper = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  zIndex: 0,
  pointerEvents: 'none',
});

const QRContainer = styled(Box)({
  borderRadius: 16,
  border: `${QR_BORDER_WIDTH}px solid #FFFFFF`,
  overflow: 'hidden',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const AddressText = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: colors.text.primary,
  textAlign: 'center',
  letterSpacing: 0.14,
  lineHeight: 1.3,
  wordBreak: 'break-all',
  userSelect: 'text',
  cursor: 'text',
  padding: `0 ${spacing.md}px`,
});

const CopyButton = styled(ButtonBase)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fcfcfc',
  borderRadius: 11,
  width: 180,
  height: 42,
  gap: 4,
  transition: 'opacity 0.2s ease',
  '&:hover': {
    opacity: 0.85,
  },
  '&:active': {
    opacity: 0.7,
  },
});

const CopyButtonText = styled(Typography)({
  fontSize: 15,
  fontWeight: 800,
  color: '#000000',
  textAlign: 'center',
  textTransform: 'capitalize',
});

// ============================================================================
// ReceiveSheet Component
// ============================================================================

/**
 * ReceiveSheet - Dialog for displaying a wallet's receive address with QR code.
 *
 * @example
 * ```tsx
 * <ReceiveSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   address="3NE4QmUT15PGZTPpqHjGH6VKUdXrpTKb82NGqYuQdXdL"
 *   onCopy={() => copyToClipboard(address)}
 * />
 * ```
 */
export function ReceiveSheet({
  visible,
  onClose,
  address,
  onCopy,
  className,
  style,
}: ReceiveSheetProps) {
  const [copied, setCopied] = useState(false);

  // Reset copied state when dialog closes
  useEffect(() => {
    if (!visible) {
      setCopied(false);
    }
  }, [visible]);

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
    } else {
      await copyToClipboard(address);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
  }, [onCopy, address]);

  return (
    <StyledDialog
      open={visible}
      onClose={onClose}
      aria-labelledby="receive-sheet-title"
      className={className}
      PaperProps={{ style }}
    >
      {/* Decorative background */}
      <BackgroundWrapper>
        <ScalesBackground />
      </BackgroundWrapper>

      {/* Title Bar */}
      <StyledDialogTitle id="receive-sheet-title">
        <TitleText>Receive</TitleText>
        <CloseButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      {/* Content */}
      <StyledDialogContent>
        {/* QR Code */}
        <QRContainer>
          <QRCode
            value={address}
            size={QR_SIZE}
            backgroundColor="#FFFFFF"
            color="#000000"
          />
        </QRContainer>

        {/* Full Address */}
        <AddressText>{address}</AddressText>

        {/* Copy Button */}
        <CopyButton
          onClick={handleCopy}
          aria-label="Copy address"
        >
          {copied ? (
            <CheckIcon sx={{ fontSize: 20, color: '#000000' }} />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 20, color: '#000000' }} />
          )}
          <CopyButtonText>
            {copied ? 'Copied!' : 'Copy address'}
          </CopyButtonText>
        </CopyButton>
      </StyledDialogContent>
    </StyledDialog>
  );
}

export default ReceiveSheet;
