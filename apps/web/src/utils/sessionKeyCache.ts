import { type DerivedKeyCache, isKeyCacheValid } from '@salmon/shared';

const SESSION_KEY_STORAGE_KEY = 'salmon_session_key';

/**
 * Store the derived key in sessionStorage.
 * Persists while the tab/window is open but cleared when the browser closes.
 */
export async function storeSessionKey(keyCache: DerivedKeyCache): Promise<void> {
  try {
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, JSON.stringify(keyCache));
  } catch (error) {
    console.warn('Failed to store session key:', error);
  }
}

/**
 * Retrieve the cached session key if valid.
 */
export async function getSessionKey(): Promise<DerivedKeyCache | null> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (!raw) return null;

    const keyCache = JSON.parse(raw) as DerivedKeyCache;
    if (isKeyCacheValid(keyCache)) {
      return keyCache;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get session key:', error);
    return null;
  }
}

/**
 * Clear the session key (on logout or password change).
 */
export async function clearSessionKey(): Promise<void> {
  try {
    sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session key:', error);
  }
}

/**
 * Check if a valid session key exists.
 */
export async function hasValidSessionKey(): Promise<boolean> {
  const key = await getSessionKey();
  return key !== null;
}
