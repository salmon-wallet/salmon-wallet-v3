/**
 * Props for the unified TransactionSuccessScreen component.
 *
 * Used by both send and swap flows on mobile and extension.
 */
export interface TransactionSuccessScreenProps {
  /** Screen title (e.g., "Send Complete", "Swap Complete") */
  title: string;
  /** Transaction summary (e.g., "5.0 SOL to 7hQ9...xK2f" or "5.0 SOL → 84.65 USDC") */
  summary: string;
  /** Pre-built explorer URL for the transaction, null if unavailable */
  explorerUrl: string | null;
  /** Callback when user taps "Continue" to navigate home */
  onContinue: () => void;
  /**
   * True while the same-chain settlement is still waiting for the indexer to
   * reflect the new balance. When set, the success screen disables "Continue"
   * and shows an "Updating balance…" indicator so the user returns home to a
   * fresh balance instead of a stale one. Always false for the bridge, whose
   * destination settles in the background.
   */
  settling?: boolean;
  /** Bridge deposit address (where user must send funds) */
  bridgeDepositAddress?: string;
  /** Bridge input amount with symbol (e.g., "33 USDC") */
  bridgeAmountIn?: string;
  /** Bridge estimated output with symbol (e.g., "0.00041798 BTC") */
  bridgeAmountOut?: string;
  /** Bridge exchange ID for tracking */
  bridgeExchangeId?: string;
  /** Bridge deposit transaction ID (on-chain tx signature) */
  bridgeDepositTxId?: string;
  /** Bridge status from provider */
  bridgeStatus?: string;
  /** Bridge payout transaction hash */
  bridgePayoutTxId?: string;
}
