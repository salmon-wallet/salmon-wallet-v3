import type { CSSProperties } from 'react';

export interface BridgeChain {
  id: string;
  name: string;
  symbol: string;
  logo?: string;
}

export interface BridgeToken {
  symbol: string;
  name: string;
  logo?: string;
  network?: string;
  balance?: number;
  usdPrice?: number;
}

export interface BridgeEstimate {
  estimatedAmount: number;
  minAmount: number;
  symbolIn: string;
  symbolOut: string;
}

export interface BridgeRecipientScreenProps {
  recipientAddress: string;
  onAddressChange: (address: string) => void;
  targetChain: BridgeChain | null;
  onBack: () => void;
  onContinue: () => void;
  isValidAddress: boolean;
  addressError?: string | null;
  style?: CSSProperties;
}

export interface BridgeReviewScreenProps {
  inToken: BridgeToken;
  outToken: BridgeToken;
  inAmount: string;
  outAmount: string;
  recipientAddress: string;
  estimate: BridgeEstimate | null;
  onBack: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  style?: CSSProperties;
}
