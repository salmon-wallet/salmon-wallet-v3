/**
 * WalletLayout - Centered container for standalone web wallet views.
 *
 * Constrains content to a phone-like column (max-width 500px) on wide screens,
 * while going full-width on mobile.  Intended to wrap the entire route tree
 * in apps/web so every page gets a consistent centred layout.
 */

import React from 'react';
import { styled } from '../utils/styled';
import Box from '@mui/material/Box';
import { colors } from '@salmon/shared';

export interface WalletLayoutProps {
  children: React.ReactNode;
  /** Override the default 500 px max-width */
  maxWidth?: number;
}

const Outer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: colors.background.primary,
});

const Inner = styled(Box)<{ $maxWidth: number }>(({ $maxWidth }) => ({
  width: '100%',
  maxWidth: $maxWidth,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

export function WalletLayout({
  children,
  maxWidth = 500,
}: WalletLayoutProps): React.ReactElement {
  return (
    <Outer>
      <Inner $maxWidth={maxWidth}>{children}</Inner>
    </Outer>
  );
}
