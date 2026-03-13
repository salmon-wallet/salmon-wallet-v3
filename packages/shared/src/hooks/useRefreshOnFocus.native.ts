import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { DEFAULT_CACHE_TTL, type UseRefreshOnFocusParams } from './useRefreshOnFocus.shared';

/**
 * useRefreshOnFocus — React Native implementation
 *
 * Listens to `AppState` changes and triggers `onFocus`
 * when the app transitions from background/inactive to active,
 * but only if cached data is stale.
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

export { useRefreshOnFocus };
