/**
 * SendSheet types for web/extension version
 *
 * Adapted from packages/ui (React Native) SendSheet types.
 * Uses CSSProperties instead of ViewStyle for web compatibility.
 */

import type { CSSProperties } from 'react';
import type { Token, SendBlockchainType } from '@salmon/shared';

export type { SendBlockchainType };

/**
 * Steps in the send flow
 */
export type SendStep = 'token-select' | 'address-amount' | 'confirmation';

/**
 * Token data for the send flow (extends Token with decimals)
 */
export interface SendToken extends Token {
  /** Token decimals for raw amount conversion */
  decimals?: number;
}

/**
 * Props for the SendSheet component
 */
export interface SendSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** Available tokens from useBalance */
  tokens: SendToken[];
  /** Blockchain type for address validation and transfer routing */
  blockchain: SendBlockchainType;
  /** The active blockchain account */
  account: any;
  /** Callback when transaction completes successfully */
  onSuccess?: (txId: string) => void;
  /** Show unverified/unknown tokens (developer mode) */
  showUnverifiedTokens?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: CSSProperties;
}

/**
 * Props for the token selection step
 */
export interface StepTokenSelectProps {
  /** Available tokens */
  tokens: SendToken[];
  /** Callback when a token is selected */
  onSelectToken: (token: SendToken) => void;
  /** Show unverified/unknown tokens (developer mode) */
  showUnverifiedTokens?: boolean;
}

/**
 * Props for the address and amount step
 */
export interface StepAddressAmountProps {
  /** Selected token */
  token: SendToken;
  /** Blockchain type for address validation */
  blockchain: SendBlockchainType;
  /** Navigate back to token selection */
  onBack: () => void;
  /** Proceed to confirmation */
  onReview: (address: string, amount: string) => void;
  /** Cancel and close the sheet */
  onCancel: () => void;
}

/**
 * Props for the confirmation step
 */
export interface StepConfirmationProps {
  /** Selected token */
  token: SendToken;
  /** Recipient address */
  recipientAddress: string;
  /** Amount to send (human-readable) */
  amount: string;
  /** Blockchain type */
  blockchain: SendBlockchainType;
  /** The active blockchain account */
  account: any;
  /** Navigate back to address/amount */
  onBack: () => void;
  /** Cancel and close the sheet */
  onCancel: () => void;
  /** Callback on successful send */
  onSuccess: (txId: string) => void;
}
