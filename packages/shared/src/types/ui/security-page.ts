/**
 * Props for the SecurityPage component (platform-agnostic base)
 */
export interface SecurityPagePropsBase {
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Extended props for mobile SecurityPage (includes biometric support)
 */
export interface SecurityPagePropsMobile extends SecurityPagePropsBase {
  /** Whether biometric auth is available on this device */
  isBiometricAvailable: boolean;
  /** Whether biometric auth is currently enabled */
  isBiometricEnabled: boolean;
  /** Callback when user toggles biometric auth */
  onToggleBiometric: (enabled: boolean) => void;
}
