/**
 * useRefreshOnFocus — Shared types + web fallback for tsc
 *
 * Platform-specific implementations (resolved by bundler):
 * - useRefreshOnFocus.native.ts (React Native AppState)
 * - useRefreshOnFocus.web.ts (document.visibilitychange)
 *
 * This base file exports the types AND a default web implementation
 * so that tsc (which doesn't resolve .web.ts/.native.ts) can type-check.
 */

import { useEffect, useRef } from 'react';

/** Default cache TTL matching useBalance (60 seconds) */
export const DEFAULT_CACHE_TTL = 60 * 1000;

export interface UseRefreshOnFocusOptions {
  /** Callback to run when app regains focus */
  onFocus: () => void;
  /** Timestamp of last successful data fetch (from useBalance) */
  lastUpdated: number | null;
  /** Cache TTL in ms — only refresh if data is older than this (default: 60000) */
  cacheTtl?: number;
  /** Whether the hook is enabled (disable when no account is active) */
  enabled?: boolean;
}

/**
 * Web implementation (default for tsc resolution).
 * Listens to `document.visibilitychange` and triggers `onFocus`
 * when the page becomes visible, but only if cached data is stale.
 */
function useRefreshOnFocus({
  onFocus,
  lastUpdated,
  cacheTtl = DEFAULT_CACHE_TTL,
  enabled = true,
}: UseRefreshOnFocusOptions): void {
  const onFocusRef = useRef(onFocus);
  useEffect(() => { onFocusRef.current = onFocus; }, [onFocus]);

  const lastUpdatedRef = useRef(lastUpdated);
  useEffect(() => { lastUpdatedRef.current = lastUpdated; }, [lastUpdated]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const last = lastUpdatedRef.current;
      if (last === null || Date.now() - last >= cacheTtl) {
        onFocusRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, cacheTtl]);
}

export default useRefreshOnFocus;
export { useRefreshOnFocus };
