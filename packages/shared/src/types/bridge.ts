/**
 * Bridge domain types.
 *
 * @module types/bridge
 */

// ============================================================================
// Hook/UI types
// ============================================================================

/**
 * Status of the bridge operation.
 */
export type BridgeOperationStatus =
  | 'idle'
  | 'loading-tokens'
  | 'getting-estimate'
  | 'creating-exchange'
  | 'exchange-created'
  | 'checking-status'
  | 'success'
  | 'failed';

/**
 * Estimate result with minimum amount.
 */
export interface BridgeEstimate {
  /** Estimated output amount */
  estimatedAmount: number;
  /** Minimum required input amount */
  minAmount: number;
  /** Input symbol */
  symbolIn: string;
  /** Output symbol */
  symbolOut: string;
}

// ============================================================================
// API types (moved from api/services/bridge.ts)
// ============================================================================

/**
 * Supported bridge token information
 */
export interface BridgeToken {
  /** Token symbol (e.g., 'BTC', 'ETH', 'SOL') */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain the token is on */
  network?: string;
  /** Token logo URL (returned as "logo" by StealthEX API) */
  logo?: string;
  /** Whether the token is enabled for bridging */
  enabled?: boolean;
  /** Minimum amount for bridging */
  minAmount?: number;
  /** Maximum amount for bridging */
  maxAmount?: number;
}

/**
 * Available token for bridging to/from a specific token
 */
export interface BridgeAvailableToken {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain identifier */
  network?: string;
  /** Token logo URL (returned as "logo" by StealthEX API) */
  logo?: string;
  /** Whether this pair is currently available */
  available?: boolean;
}

/**
 * Featured bridge token pair
 */
export interface BridgeFeaturedToken {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Network/chain identifier */
  network?: string;
  /** Token logo URL (returned as "logo" by StealthEX API) */
  logo?: string;
  /** Popularity rank */
  rank?: number;
}

/**
 * Estimated amount response from bridge
 */
export interface BridgeEstimateResponse {
  /** Estimated output amount */
  estimated_amount: number;
  /** Input symbol */
  from?: string;
  /** Output symbol */
  to?: string;
  /** Exchange rate */
  rate?: number;
}

/**
 * Minimal amount response from bridge
 */
export interface BridgeMinimalResponse {
  /** Minimum required input amount */
  min_amount: number;
  /** Input symbol */
  from?: string;
  /** Output symbol */
  to?: string;
}

/**
 * Bridge exchange creation response
 */
export interface BridgeExchange {
  /** Unique exchange ID */
  id: string;
  /** Input token symbol */
  currencyFrom: string;
  /** Output token symbol */
  currencyTo: string;
  /** Input amount */
  amountExpectedFrom: number;
  /** Expected output amount */
  amountExpectedTo: number;
  /** Deposit address to send tokens to */
  payinAddress: string;
  /** Extra ID for deposit (memo/tag) if required */
  payinExtraId?: string;
  /** Address where output tokens will be sent */
  payoutAddress: string;
  /** Extra ID for payout if required */
  payoutExtraId?: string;
  /** Exchange status */
  status: string;
  /** Creation timestamp */
  createdAt?: string;
}

/**
 * Possible bridge transaction statuses
 */
export type BridgeTransactionStatus =
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'overdue'
  | 'hold';

/**
 * Bridge transaction status response
 */
export interface BridgeTransaction {
  /** Unique transaction ID */
  id: string;
  /** Input token symbol */
  currencyFrom: string;
  /** Output token symbol */
  currencyTo: string;
  /** Network fee */
  networkFee?: number;
  /** Input amount expected */
  amountExpectedFrom?: number;
  /** Output amount expected */
  amountExpectedTo?: number;
  /** Actual input amount received */
  amountFrom?: number;
  /** Actual output amount sent */
  amountTo?: number;
  /** Deposit address */
  payinAddress: string;
  /** Deposit extra ID (memo/tag) */
  payinExtraId?: string;
  /** Deposit transaction hash */
  payinHash?: string;
  /** Payout address */
  payoutAddress: string;
  /** Payout extra ID */
  payoutExtraId?: string;
  /** Payout transaction hash */
  payoutHash?: string;
  /** Current transaction status */
  status: BridgeTransactionStatus;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}
