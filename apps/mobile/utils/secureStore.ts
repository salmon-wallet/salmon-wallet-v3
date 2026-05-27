// Web fallback: uses localStorage as a substitute for expo-secure-store.
// NOTE: localStorage is NOT secure — only non-sensitive keys (e.g. language
// preference) should reach this code path. Biometric keys are never stored
// on web because localAuthentication stubs return isAvailable: false.

export async function getItemAsync(
  key: string,
  _options?: Record<string, unknown>
): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItemAsync(
  key: string,
  value: string,
  _options?: Record<string, unknown>
): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable (e.g. private browsing)
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

export function canUseBiometricAuthentication(): boolean {
  return false;
}

const SecureStore = {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  canUseBiometricAuthentication,
};

export default SecureStore;
