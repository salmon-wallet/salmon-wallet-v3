/**
 * AddressCopyRow - Displays an address with a copy button
 *
 * Migrated from packages/ui (React Native) to MUI styled components.
 * Uses navigator.clipboard API instead of expo-clipboard.
 *
 * Features:
 * - Label on the left
 * - Truncated address display
 * - Copy button on the right
 * - Visual feedback (checkmark) after copying
 */

import React, { useCallback, useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { colors, borderRadius, getShortAddress, copyToClipboard } from '@salmon/shared';
import type { AddressCopyRowProps } from './types';

// ============================================================================
// Constants
// ============================================================================

const TRUNCATE_CHARS: Record<'short' | 'medium' | 'long', number> = {
  short: 4,
  medium: 6,
  long: 8,
};

const COPIED_FEEDBACK_DURATION = 1500;

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: `${colors.background.card}60`,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border.default}`,
});

const Label = styled(Typography)({
  fontSize: 13,
  fontWeight: 500,
  color: colors.text.secondary,
  flexShrink: 0,
});

const RightSection = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  justifyContent: 'flex-end',
  marginLeft: 12,
  minWidth: 0,
});

const AddressText = styled(Typography)({
  fontSize: 13,
  color: colors.text.primary,
  marginRight: 8,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'monospace',
});

const CopyButton = styled(IconButton)({
  width: 28,
  height: 28,
  padding: 4,
  backgroundColor: `${colors.background.card}80`,
  '&:hover': {
    backgroundColor: `${colors.background.card}`,
  },
});

// ============================================================================
// Component
// ============================================================================

export const AddressCopyRow: React.FC<AddressCopyRowProps> = ({
  label,
  address,
  truncate = 'medium',
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const displayAddress =
    truncate === false
      ? address
      : getShortAddress(address, TRUNCATE_CHARS[truncate]) ?? address;

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_DURATION);
    } catch (error) {
      console.warn('Failed to copy address:', error);
    }
  }, [address]);

  return (
    <Container className={className}>
      <Label>{label}</Label>
      <RightSection>
        <AddressText>{displayAddress}</AddressText>
        <CopyButton
          onClick={handleCopy}
          size="small"
          aria-label={`Copy ${label} address`}
          sx={copied ? { backgroundColor: `${colors.status.success}20` } : undefined}
        >
          {copied ? (
            <CheckIcon sx={{ fontSize: 14, color: colors.status.success }} />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 14, color: colors.text.secondary }} />
          )}
        </CopyButton>
      </RightSection>
    </Container>
  );
};

export default AddressCopyRow;
