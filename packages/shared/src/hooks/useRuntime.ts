/**
 * @fileoverview Platform-agnostic runtime hook with automatic environment detection.
 *
 * This module provides a unified interface for runtime context across all platforms:
 * - Web browsers
 * - Browser extensions (WXT/Chrome/Firefox)
 * - React Native / Expo mobile apps
 *
 * The hook automatically detects the runtime environment and provides
 * appropriate adapter detection logic for each platform.
 *
 * @example
 * ```tsx
 * // Direct import - will use the correct implementation based on bundler config
 * import { useRuntime } from '@salmon/shared/hooks';
 *
 * // Or use platform-specific imports if needed:
 * import useRuntime from '@salmon/shared/hooks/useRuntime.web';  // Web/Extension
 * import useRuntime from '@salmon/shared/hooks/useRuntime.native'; // React Native
 * ```
 */

import { useMemo } from 'react';
import { isReactNative, isExtension } from '../utils/platform';

// ============================================================================
// Types (inlined from former hooks/types.ts)
// ============================================================================

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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Web implementation of useRuntime.
 * Synchronously resolves context from URL hash.
 */
const useRuntimeWeb = (): RuntimeInfo => {
  const context = useMemo(
    () => new URLSearchParams(window.location.hash.slice(1)),
    []
  );

  const opener = useMemo(() => window.opener as Window | null, []);

  const isAdapter = useMemo(
    () => context.has('origin') && (isExtension() || !!opener),
    [context, opener]
  );

  return {
    ready: true,
    context,
    opener,
    isAdapter,
  };
};

/**
 * Runtime hook for detecting adapter mode and connection context.
 *
 * This is the base implementation for web environments. For React Native,
 * use the platform-specific import or configure your bundler to resolve
 * `.native.ts` extensions automatically.
 *
 * @returns RuntimeInfo object containing:
 *   - `ready`: Whether the runtime is initialized
 *   - `context`: URL parameters for the connection
 *   - `opener`: Reference to window.opener (web only)
 *   - `isAdapter`: Whether running in adapter/dApp connection mode
 */
const useRuntime = (): RuntimeInfo => {
  // In environments where React Native is detected at runtime,
  // we need to throw an error since the async behavior is different.
  // The bundler should resolve to .native.ts for RN environments.
  if (isReactNative()) {
    throw new Error(
      'useRuntime: Detected React Native environment but using web implementation. ' +
      'Configure your bundler to resolve .native.ts extensions, or import from ' +
      "'@salmon/shared/hooks/useRuntime.native' directly."
    );
  }

  return useRuntimeWeb();
};

export default useRuntime;
