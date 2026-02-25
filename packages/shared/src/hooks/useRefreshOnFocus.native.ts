import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { DEFAULT_CACHE_TTL, type UseRefreshOnFocusOptions } from './useRefreshOnFocus';

/**
 * useRefreshOnFocus — React Native implementation
 *
 * Listens to `AppState` changes and triggers `onFocus`
 * when the app transitions from background/inactive to active,
 * but only if cached data is stale.
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

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;

      if (!wasInactive || nextState !== 'active') return;

      const last = lastUpdatedRef.current;
      if (last === null || Date.now() - last >= cacheTtl) {
        onFocusRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, cacheTtl]);
}

export default useRefreshOnFocus;
export { useRefreshOnFocus };
