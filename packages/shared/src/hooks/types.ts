/**
 * Runtime information interface for the useRuntime hook.
 * This interface provides platform-agnostic runtime context
 * for detecting adapter mode and connection context.
 */
export interface RuntimeInfo {
  /**
   * Indicates if the runtime is ready and initialized.
   * On web/extension, this is always true.
   * On React Native, this is true after the initial URL has been resolved.
   */
  ready: boolean;

  /**
   * URL context parameters parsed from the hash or deep link.
   * Used for extracting connection parameters from the URL.
   */
  context: URLSearchParams;

  /**
   * Reference to the window opener (web only).
   * Null on React Native platforms.
   */
  opener: Window | null;

  /**
   * Indicates if the app was opened in adapter mode.
   * Adapter mode is used when the wallet is invoked by a dApp
   * to sign transactions or connect.
   */
  isAdapter: boolean;
}

/**
 * Adapter URL prefixes used to detect adapter mode on React Native.
 */
export const ADAPTER_PREFIXES = [
  'solana-wallet:',
  'https://salmonwallet.io/adapter',
] as const;
