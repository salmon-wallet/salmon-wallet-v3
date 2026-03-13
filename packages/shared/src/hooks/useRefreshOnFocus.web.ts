import { useEffect, useRef } from 'react';
import { DEFAULT_CACHE_TTL, type UseRefreshOnFocusParams } from './useRefreshOnFocus.shared';

/**
 * useRefreshOnFocus — Web implementation
 *
 * Listens to `document.visibilitychange` and triggers `onFocus`
 * when the page becomes visible, but only if cached data is stale.
 */
// NOTE: Returns void instead of [State, Actions] tuple.
// This is a pure side-effect hook (event listener lifecycle) — there is no state
// to expose or actions to provide; the caller controls behavior via params.
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
