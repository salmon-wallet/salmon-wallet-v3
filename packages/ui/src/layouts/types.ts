import type React from 'react';

export interface WalletLayoutProps {
  children: React.ReactNode;
  /** Override the default 375 px max-width */
  maxWidth?: number;
}
