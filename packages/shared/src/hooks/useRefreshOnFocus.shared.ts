/**
 * Shared types and constants for useRefreshOnFocus hook.
 *
 * Extracted to a separate file to avoid Metro platform-resolution self-cycles.
 * Metro resolves `./useRefreshOnFocus` → `./useRefreshOnFocus.native.ts` on
 * React Native, so `.native.ts` cannot import from the base module without
 * creating a cycle. The `.shared.ts` suffix is not a platform extension and
 * resolves consistently.
 */

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
