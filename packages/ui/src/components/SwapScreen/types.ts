import type { ViewStyle } from 'react-native';

/**
 * Chain type for unified swap/bridge
 */
export type SwapChainType = 'solana' | 'bitcoin' | 'ethereum';

/**
 * Token data for swap operations
 */
export interface SwapToken {
  /** Token mint address */
  address: string;
  /** Token symbol (e.g., "SOL", "USDC") */
  symbol: string;
  /** Token name */
  name?: string;
  /** Token decimals */
  decimals: number;
  /** Token logo URL */
  logo?: string;
  /** User's balance of this token */
  balance?: number;
  /** USD price per token */
  usdPrice?: number;
  /** Chain this token belongs to (for unified swap/bridge) */
  chain?: SwapChainType;
  /** Network ID (e.g., 'mainnet-beta', 'bitcoin', 'ethereum') */
  networkId?: string;
}

/**
 * Quote data from swap API
 * Aligned with backend response from /v1/{networkId}/ft/swap/order
 */
export interface SwapQuote {
  /** Request ID - REQUIRED for execute endpoint */
  requestId: string;
  /** Input token details */
  input: {
    amount: number;
    symbol: string;
    decimals: number;
    /** Token name */
    name?: string;
    /** Token logo URL */
    logo?: string;
    /** Token mint address */
    contract?: string;
  };
  /** Output token details */
  output: {
    amount: number;
    symbol: string;
    decimals: number;
    /** Token name */
    name?: string;
    /** Token logo URL */
    logo?: string;
    /** Token mint address */
    contract?: string;
  };
  /** Fee information */
  fee: {
    /** Fee amount in smallest unit (lamports for SOL) */
    amount: number;
    /** Fee as percentage (e.g., 0.5 for 0.5%) */
    percent: number;
    /** Fee token symbol (usually 'SOL') */
    symbol: string;
    /** Fee decimals (9 for SOL) */
    decimals?: number;
  };
  /** Route/swap details */
  details: {
    /** DEX router used (iris, jupiterz, dflow, okx) */
    router: string;
    /** Price impact percentage */
    priceImpact: number;
    /** Priority fee in lamports */
    priorityFee: number;
    /** Rent fee in lamports */
    rentFee: number;
    /** Slippage tolerance in basis points */
    slippageBps: number;
    /** Minimum amount received (after slippage) */
    minimumReceived: number;
    /** Swap mode (ExactIn or ExactOut) */
    swapMode: string;
    /** Whether swap is gasless */
    gasless?: boolean;
    /** Fee in basis points (from backend feeBps) */
    feeBps?: number;
    /** Input amount in USD */
    inUsdValue?: number;
    /** Output amount in USD */
    outUsdValue?: number;
  };
  /** Base64 encoded unsigned transaction */
  transaction: string;
  /** Route names (DEX labels for each hop) */
  routeNames?: string[];
  /** Route symbols (token symbols in path) */
  routeSymbols?: string[];
}

/**
 * Active tab in swap screen
 */
export type SwapTab = 'swap' | 'bridge';

/**
 * Current step in swap flow
 */
export type SwapStep = 'input' | 'review' | 'processing' | 'success' | 'error';

/**
 * Props for SwapTabSelector component
 */
export interface SwapTabSelectorProps {
  /** Currently active tab */
  activeTab: SwapTab;
  /** Callback when tab changes */
  onTabChange: (tab: SwapTab) => void;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for SwapAmountInput component
 */
export interface SwapAmountInputProps {
  /** Label above the input (e.g., "You Send", "You Receive") */
  label: string;
  /** Current amount value */
  value: string;
  /** Callback when amount changes */
  onChangeValue: (value: string) => void;
  /** Selected token */
  token: SwapToken | null;
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
}

/**
 * Props for SwapDetailRow component
 */
export interface SwapDetailRowProps {
  /** Label on the left */
  label: string;
  /** Value on the right */
  value: string;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for SwapReviewCard component
 */
export interface SwapReviewCardProps {
  /** Card label (e.g., "You Send", "You Receive") */
  label: string;
  /** Amount with symbol (e.g., "0.009 SOL") */
  amount: string;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Props for SwapReviewScreen sub-component
 */
export interface SwapReviewScreenProps {
  /** Quote data */
  quote: SwapQuote;
  /** Input token */
  inToken: SwapToken;
  /** Output token */
  outToken: SwapToken;
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
 * Props for SwapInputScreen sub-component
 */
export interface SwapInputScreenProps {
  /** Input token */
  inToken: SwapToken | null;
  /** Output token */
  outToken: SwapToken | null;
  /** Input amount */
  inAmount: string;
  /** Output amount (estimated) */
  outAmount: string;
  /** Callback when input amount changes */
  onInAmountChange: (value: string) => void;
  /** Callback when input token selector is pressed */
  onInTokenPress: () => void;
  /** Callback when output token selector is pressed */
  onOutTokenPress: () => void;
  /** USD value of input */
  inUsdValue?: number;
  /** Whether quote is loading */
  isLoadingQuote?: boolean;
  /** Whether Review button is enabled */
  canReview: boolean;
  /** Callback for Review button */
  onReview: () => void;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Bridge token type (simplified for SwapScreen integration)
 */
export interface BridgeTokenSimple {
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
 * Bridge estimate type (simplified)
 */
export interface BridgeEstimateSimple {
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
 * Bridge exchange result type (simplified)
 */
export interface BridgeExchangeSimple {
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
 * Props for main SwapScreen component
 */
export interface SwapScreenProps {
  /** User's tokens for selection */
  tokens: SwapToken[];
  /** Featured tokens for quick selection */
  featuredTokens?: SwapToken[];
  /** Callback to fetch quote */
  onGetQuote: (inToken: SwapToken, outToken: SwapToken, amount: string) => Promise<SwapQuote>;
  /** Callback to execute swap */
  onSwap: (quote: SwapQuote) => Promise<{ txId: string }>;
  /** Callback when swap succeeds */
  onSuccess?: (txId: string) => void;
  /** Callback when swap fails */
  onError?: (error: Error) => void;
  /** Callback to search tokens */
  onSearchTokens?: (query: string) => Promise<SwapToken[]>;
  /** Initial input token */
  initialInToken?: SwapToken;
  /** Initial output token */
  initialOutToken?: SwapToken;
  /** Custom style */
  style?: ViewStyle;

  // Bridge-related props (optional - if provided, bridge tab becomes functional)
  /** Bridge source tokens (user's tokens available for bridging) */
  bridgeTokens?: BridgeTokenSimple[];
  /** Featured bridge tokens */
  bridgeFeaturedTokens?: BridgeTokenSimple[];
  /** Callback to get available destination tokens for a source token */
  onGetAvailableTokens?: (sourceSymbol: string) => Promise<BridgeTokenSimple[]>;
  /** Callback to get bridge estimate */
  onGetBridgeEstimate?: (
    symbolIn: string,
    symbolOut: string,
    amount: number
  ) => Promise<BridgeEstimateSimple | null>;
  /** Callback to create bridge exchange */
  onCreateBridgeExchange?: (
    symbolIn: string,
    symbolOut: string,
    amount: number,
    addressTo: string
  ) => Promise<BridgeExchangeSimple | null>;
  /** Callback when bridge succeeds */
  onBridgeSuccess?: (exchange: BridgeExchangeSimple) => void;
  /** Callback when bridge fails */
  onBridgeError?: (error: Error) => void;
  /** Callback to search bridge source tokens */
  onSearchBridgeTokens?: (query: string) => Promise<BridgeTokenSimple[]>;
}
