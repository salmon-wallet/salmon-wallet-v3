/**
 * LockScreenOverlay Component Types
 *
 * Type definitions for the animated lock screen overlay
 * that slides down/up as a curtain over the app content.
 *
 * @module components/LockScreenOverlay
 */

// ============================================================================
// Biometric Configuration (injectable from consumer)
// ============================================================================

/**
 * State representing the device's biometric capabilities.
 * Provided by the consumer's biometric hook (e.g., useBiometricAuth).
 */
export interface BiometricAuthState {
  /** Whether biometric hardware is available on the device */
  isAvailable: boolean;
  /** Whether a derived key is stored for biometric unlock */
  hasStoredKey: boolean;
  /** The type of biometric available (null if none) */
  biometricType: 'fingerprint' | 'facial' | 'iris' | null;
}

/**
 * Biometric authentication configuration.
 * Optional — if not provided, no biometric UI is shown.
 * This allows the component to remain platform-agnostic while
 * the consumer provides the platform-specific biometric implementation.
 */
export interface BiometricConfig {
  /** Current biometric state */
  state: BiometricAuthState;
  /** Authenticate with biometrics and retrieve the stored key */
  authenticateWithBiometric: () => Promise<string | null>;
  /** Store a derived key for future biometric unlock */
  storeKeyForBiometric: (derivedKeyJson: string) => Promise<boolean>;
  /** Whether biometric unlock is enabled by the user */
  enableBiometric: boolean;
  /** Refresh the biometric state (useful after app resume) */
  refreshState: () => Promise<void>;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the LockScreenOverlay component.
 */
export interface LockScreenOverlayProps {
  /** Whether the wallet is currently locked */
  locked: boolean;
  /** Callback to attempt unlock with password */
  onUnlock: (password: string) => Promise<boolean>;
  /**
   * Callback to unlock with cached derived key (for biometric unlock).
   * The keyJson is the serialized DerivedKeyCache from a previous password unlock.
   * Returns true if unlock succeeded.
   */
  onUnlockWithKey?: (keyJson: string) => Promise<boolean>;
  /**
   * Callback after successful password unlock to get the derived key.
   * This key should be stored for future biometric unlocks.
   */
  onGetDerivedKey?: () => Promise<string | null>;
  /** Callback to remove all accounts (reset wallet) */
  onRemoveAllAccounts: () => Promise<void>;
  /** Callback when animation completes after unlock */
  onAnimationComplete?: () => void;
  /**
   * Optional biometric configuration. If provided, the component
   * will show biometric unlock UI (Face ID / Touch ID button).
   * If omitted, only password unlock is available.
   */
  biometric?: BiometricConfig;
}
