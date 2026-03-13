/**
 * useRefreshOnFocus — Web fallback for tsc
 *
 * Platform-specific implementations (resolved by bundler):
 * - useRefreshOnFocus.native.ts (React Native AppState)
 * - useRefreshOnFocus.web.ts (document.visibilitychange)
 *
 * Shared types and constants live in useRefreshOnFocus.shared.ts to avoid
 * Metro platform-resolution self-cycles.
 *
 * This base file re-exports them AND provides a default web implementation
 * so that tsc (which doesn't resolve .web.ts/.native.ts) can type-check.
 */

import { useEffect, useRef } from 'react';

// Re-export shared types and constants so existing consumers are unaffected
export { DEFAULT_CACHE_TTL } from './useRefreshOnFocus.shared';
export type { UseRefreshOnFocusParams } from './useRefreshOnFocus.shared';
import { DEFAULT_CACHE_TTL } from './useRefreshOnFocus.shared';
import type { UseRefreshOnFocusParams } from './useRefreshOnFocus.shared';

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
}: UseRefreshOnFocusParams): void {
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

export { useRefreshOnFocus };
