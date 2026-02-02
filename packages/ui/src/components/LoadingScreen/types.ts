/**
 * LoadingScreen types
 */

export interface LoadingScreenProps {
  /** Whether the loading screen is visible */
  visible: boolean;
  /** Optional title to display */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Custom tips to cycle through (defaults to wallet tips) */
  tips?: string[];
  /** Interval in ms to change tips (default: 4000) */
  tipInterval?: number;
  /** Whether to show tips (default: true) */
  showTips?: boolean;
  /** Custom logo size (default: 100) */
  logoSize?: number;
  /** Custom spinner size (default: 140) */
  spinnerSize?: number;
}

export const DEFAULT_WALLET_TIPS = [
  'Never share your seed phrase with anyone',
  'Always verify transaction details before signing',
  'Keep your recovery phrase in a safe place offline',
  'Enable biometric authentication for extra security',
  'Double-check wallet addresses before sending',
  'Your keys, your crypto - stay in control',
  'Bookmark official sites to avoid phishing',
  'Start with small test transactions',
  'Keep your app updated for security patches',
  'Use a hardware wallet for large holdings',
] as const;
