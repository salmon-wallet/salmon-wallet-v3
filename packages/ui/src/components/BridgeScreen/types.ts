import type { ViewStyle } from 'react-native';

/**
 * Network/Chain data for bridge operations
 */
export interface BridgeChain {
  /** Chain identifier (e.g., 'solana', 'ethereum', 'bitcoin') */
  id: string;
  /** Display name (e.g., 'Solana', 'Ethereum', 'Bitcoin') */
  name: string;
  /** Chain symbol (e.g., 'SOL', 'ETH', 'BTC') */
  symbol: string;
  /** Chain logo URL */
  logo?: string;
}

/**
 * Token data for bridge operations
 */
export interface BridgeToken {
  /** Token symbol (e.g., "SOL", "ETH", "USDC") */
  symbol: string;
  /** Token name */
  name: string;
  /** Token logo URL */
  logo?: string;
  /** Network/chain this token is on */
  network?: string;
  /** User's balance of this token */
  balance?: number;
  /** USD price per token */
  usdPrice?: number;
}

/**
 * Bridge estimate data
 */
export interface BridgeEstimate {
  /** Estimated output amount */
  estimatedAmount: number;
  /** Minimum required input amount */
  minAmount: number;
  /** Input token symbol */
  symbolIn: string;
  /** Output token symbol */
  symbolOut: string;
}

/**
 * Bridge exchange details (created exchange)
 */
export interface BridgeExchange {
  /** Exchange ID for tracking */
  id: string;
  /** Deposit address (where user sends funds) */
  depositAddress: string;
  /** Input amount */
  amountIn: number;
  /** Expected output amount */
  amountOut: number;
  /** Input token symbol */
  symbolIn: string;
  /** Output token symbol */
  symbolOut: string;
  /** Destination address */
  addressTo: string;
  /** Exchange status */
  status: string;
}

/**
 * Current step in bridge flow
 */
export type BridgeStep = 'input' | 'recipient' | 'review' | 'processing' | 'success' | 'error';

/**
 * Props for ChainSelector component
 */
export interface ChainSelectorProps {
  /** Selected chain */
  chain: BridgeChain | null;
  /** Available chains */
  chains: BridgeChain[];
  /** Callback when chain is selected */
  onSelect: (chain: BridgeChain) => void;
  /** Label above selector */
  label?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Whether selector is disabled */
  disabled?: boolean;
}

/**
 * Props for BridgeTokenSelector component
 */
export interface BridgeTokenSelectorProps {
  /** Selected token */
  token: BridgeToken | null;
  /** Callback when token selector is pressed */
  onPress: () => void;
  /** Label (e.g., "From", "To") */
  label?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Show loading state */
  isLoading?: boolean;
}

/**
 * Props for BridgeAmountInput component
 */
export interface BridgeAmountInputProps {
  /** Label above the input (e.g., "You Send", "You Receive") */
  label: string;
  /** Current amount value */
  value: string;
  /** Callback when amount changes */
  onChangeValue: (value: string) => void;
  /** Selected token */
  token: BridgeToken | null;
  /** Callback when token selector is pressed */
  onTokenPress: () => void;
  /** USD value of the amount */
  usdValue?: number;
  /** Available balance (for "You Send" input) */
  availableBalance?: number;
  /** Whether input is editable */
  editable?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Show loading state for amount */
  isLoading?: boolean;
  /** Minimum amount required */
  minAmount?: number;
}

/**
 * Props for RecipientAddressInput component
 */
export interface RecipientAddressInputProps {
  /** Current address value */
  value: string;
  /** Callback when address changes */
  onChangeValue: (value: string) => void;
  /** Target chain/network for validation hints */
  targetChain?: BridgeChain | null;
  /** Label above input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Error message to display (overrides internal validation messages) */
  error?: string | null;
  /** Callback when address validation completes */
  onValidation?: (result: { isValid: boolean; message: string | null }) => void;
}

/**
 * Props for BridgeInputScreen sub-component
 */
export interface BridgeInputScreenProps {
  /** Source token (what user is sending) */
  inToken: BridgeToken | null;
  /** Destination token (what user receives) */
  outToken: BridgeToken | null;
  /** Input amount */
  inAmount: string;
  /** Output amount (estimated) */
  outAmount: string;
  /** Callback when input amount changes */
  onInAmountChange: (value: string) => void;
  /** Callback when source token selector is pressed */
  onInTokenPress: () => void;
  /** Callback when destination token selector is pressed */
  onOutTokenPress: () => void;
  /** USD value of input */
  inUsdValue?: number;
  /** Whether estimate is loading */
  isLoadingEstimate?: boolean;
  /** Minimum amount required */
  minAmount?: number;
  /** Whether Continue button is enabled */
  canContinue: boolean;
  /** Callback for Continue button */
  onContinue: () => void;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for BridgeRecipientScreen sub-component
 */
export interface BridgeRecipientScreenProps {
  /** Recipient address */
  recipientAddress: string;
  /** Callback when address changes */
  onAddressChange: (address: string) => void;
  /** Target chain for the bridge */
  targetChain: BridgeChain | null;
  /** Callback for back button */
  onBack: () => void;
  /** Callback for continue button */
  onContinue: () => void;
  /** Whether address is valid */
  isValidAddress: boolean;
  /** Address validation error */
  addressError?: string | null;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for BridgeReviewScreen sub-component
 */
export interface BridgeReviewScreenProps {
  /** Source token */
  inToken: BridgeToken;
  /** Destination token */
  outToken: BridgeToken;
  /** Input amount */
  inAmount: string;
  /** Estimated output amount */
  outAmount: string;
  /** Recipient address */
  recipientAddress: string;
  /** Bridge estimate data */
  estimate: BridgeEstimate | null;
  /** Callback for back button */
  onBack: () => void;
  /** Callback for confirm button */
  onConfirm: () => void;
  /** Whether confirm is in progress */
  isConfirming?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for main BridgeScreen component
 */
export interface BridgeScreenProps {
  /** User's tokens for selection (source tokens) */
  tokens: BridgeToken[];
  /** Featured source tokens */
  featuredTokens?: BridgeToken[];
  /** Callback to get available destination tokens */
  onGetAvailableTokens: (sourceSymbol: string) => Promise<BridgeToken[]>;
  /** Callback to get bridge estimate */
  onGetEstimate: (
    symbolIn: string,
    symbolOut: string,
    amount: number
  ) => Promise<BridgeEstimate | null>;
  /** Callback to create bridge exchange */
  onCreateExchange: (
    symbolIn: string,
    symbolOut: string,
    amount: number,
    addressTo: string
  ) => Promise<BridgeExchange | null>;
  /** Callback when bridge succeeds */
  onSuccess?: (exchange: BridgeExchange) => void;
  /** Callback when bridge fails */
  onError?: (error: Error) => void;
  /** Callback to search source tokens */
  onSearchTokens?: (query: string) => Promise<BridgeToken[]>;
  /** Initial source token */
  initialInToken?: BridgeToken;
  /** Custom style */
  style?: ViewStyle;
}
