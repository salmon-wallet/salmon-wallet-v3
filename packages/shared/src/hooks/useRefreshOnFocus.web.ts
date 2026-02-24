import { useEffect, useRef } from 'react';
import { DEFAULT_CACHE_TTL, type UseRefreshOnFocusOptions } from './useRefreshOnFocus';

/**
 * useRefreshOnFocus — Web implementation
 *
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
  onFocusRef.current = onFocus;

  const lastUpdatedRef = useRef(lastUpdated);
  lastUpdatedRef.current = lastUpdated;

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
