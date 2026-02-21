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
}
