import type { Token } from '../index';
import type { BlockchainType, BlockchainAccount } from '../blockchain';

/**
 * Steps in the send flow
 */
export type SendStep = 'token-select' | 'address-amount' | 'confirmation' | 'success';

/**
 * Token data for the send flow (extends Token with decimals)
 */
export interface SendToken extends Token {
  /** Token decimals for raw amount conversion */
  decimals?: number;
}

/**
 * Props for the SendSheet component (base - platform-agnostic)
 */
export interface SendSheetPropsBase<TStyle> {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when the sheet should close */
  onClose: () => void;
  /** Available tokens from useBalance */
  tokens: SendToken[];
  /** Blockchain type for address validation and transfer routing */
  blockchain: BlockchainType;
  /** The active blockchain account */
  account: BlockchainAccount;
  /** Callback when transaction completes successfully */
  onSuccess?: (txId: string) => void;
  /** Show unverified/unknown tokens (developer mode) */
  showUnverifiedTokens?: boolean;
  /** Additional styles */
  style?: TStyle;
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
 * Props for the address and amount step (base - platform-agnostic)
 */
export interface StepAddressAmountPropsBase {
  /** Selected token */
  token: SendToken;
  /** Blockchain type for address validation */
  blockchain: BlockchainType;
  /** The active blockchain account (provides getConnection/getProvider) */
  account: BlockchainAccount;
  /** Navigate back to token selection */
  onBack: () => void;
  /** Proceed to confirmation */
  onReview: (address: string, amount: string) => void;
  /** Cancel and close the sheet */
  onCancel: () => void;
}

// ============================================================================
// Send contact selector types
// ============================================================================

/**
 * A contact from the address book, filtered for the send flow.
 */
export interface SendContact {
  /** User-defined label */
  name: string;
  /** Blockchain address */
  address: string;
  /** Human-readable network name */
  networkName: string;
  /** Blockchain type (e.g., 'solana', 'ethereum', 'bitcoin') */
  blockchain: string;
  /** Optional domain name (e.g., .sol, .eth) */
  domain?: string | null;
}

/**
 * One of the user's own wallet addresses on the active network.
 */
export interface SendOwnWallet {
  /** Account name (e.g., "Account #1") */
  accountName: string;
  /** Blockchain address */
  address: string;
}

/**
 * Return type for the useSendContacts hook.
 */
export interface UseSendContactsResult {
  /** Address book contacts matching the active network, excluding the sender */
  contacts: SendContact[];
  /** User's other wallets on the active network, excluding the sender */
  ownWallets: SendOwnWallet[];
  /** Whether address book data is still loading */
  isLoading: boolean;
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
  blockchain: BlockchainType;
  /** The active blockchain account */
  account: BlockchainAccount;
  /** Navigate back to address/amount */
  onBack: () => void;
  /** Cancel and close the sheet */
  onCancel: () => void;
  /** Callback on successful send */
  onSuccess: (txId: string) => void;
}
