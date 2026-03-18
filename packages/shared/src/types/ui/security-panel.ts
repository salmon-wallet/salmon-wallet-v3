/**
 * Props for the SecurityPanel component (platform-agnostic base)
 */
export interface SecurityPanelPropsBase {
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Extended props for mobile SecurityPanel (includes biometric support)
 */
export interface SecurityPanelPropsMobile extends SecurityPanelPropsBase {
  /** Whether biometric auth is available on this device */
  isBiometricAvailable: boolean;
  /** Whether biometric auth is currently enabled */
  isBiometricEnabled: boolean;
  /** Callback when user toggles biometric auth */
  onToggleBiometric: (enabled: boolean) => void;
  /** Callback after password is successfully changed (e.g. to invalidate biometric key) */
  onPasswordChanged?: () => Promise<void>;
}
