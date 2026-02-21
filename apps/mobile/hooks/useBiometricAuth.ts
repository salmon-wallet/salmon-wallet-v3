/**
 * Biometric authentication hook for secure wallet unlock.
 *
 * This hook provides biometric authentication functionality including:
 * - Checking device biometric capabilities
 * - Storing derived encryption keys securely with biometric protection
 * - Retrieving keys using biometric authentication
 * - Managing user preferences for biometric unlock
 *
 * The hook uses expo-local-authentication for biometric prompts and
 * expo-secure-store for secure key storage with biometric protection.
 *
 * @module hooks/useBiometricAuth
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from '../utils/localAuthentication';
import * as SecureStore from '../utils/secureStore';

// ============================================================================
// Constants
// ============================================================================

/**
 * Storage key for the biometrically-protected derived key.
 */
const BIOMETRIC_KEY_STORAGE = 'salmon_biometric_key';

/**
 * Storage key for user's biometric preference.
 */
const BIOMETRIC_ENABLED_KEY = 'salmon_biometric_enabled';

/**
 * Prompt message shown during biometric authentication.
 */
const BIOMETRIC_PROMPT_MESSAGE = 'Authenticate to unlock your wallet';

// ============================================================================
// Types
// ============================================================================

/**
 * State representing the device's biometric capabilities.
 */
export interface BiometricAuthState {
  /** Whether biometric hardware is available on the device */
  isAvailable: boolean;
  /** Whether the user has enrolled biometrics (e.g., registered a fingerprint) */
  isEnrolled: boolean;
  /** The type of biometric available (null if none) */
  biometricType: 'fingerprint' | 'facial' | 'iris' | null;
  /** Whether a derived key is stored for biometric unlock */
  hasStoredKey: boolean;
}

/**
 * Return type for the useBiometricAuth hook.
 */
export interface UseBiometricAuthReturn {
  /** Current biometric state */
  state: BiometricAuthState;
  /** Authenticate with biometrics and retrieve the stored key */
  authenticateWithBiometric: () => Promise<string | null>;
  /** Store a derived key for future biometric unlock */
  storeKeyForBiometric: (derivedKeyJson: string) => Promise<boolean>;
  /** Clear the stored biometric key (for logout/reset) */
  clearBiometricKey: () => Promise<void>;
  /** Whether biometric unlock is enabled by the user */
  enableBiometric: boolean;
  /** Toggle biometric unlock preference */
  setEnableBiometric: (enabled: boolean) => Promise<void>;
  /** Refresh the biometric state (useful after app resume) */
  refreshState: () => Promise<void>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps LocalAuthentication types to our simplified type.
 */
function getBiometricType(
  types: LocalAuthentication.AuthenticationType[]
): 'fingerprint' | 'facial' | 'iris' | null {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing biometric authentication for wallet unlock.
 *
 * This hook enables Face ID/Touch ID unlock by securely storing the
 * derived encryption key (from PBKDF2) in the device's secure enclave
 * with biometric protection.
 *
 * **Security Model:**
 * - The derived key (not the password) is stored in SecureStore
 * - Access to the key requires biometric authentication
 * - The key is the same one used for vault decryption
 * - If biometrics are compromised, only the session key is exposed
 *
 * **Usage Flow:**
 * 1. On successful password unlock, call `storeKeyForBiometric(keyJson)`
 * 2. On subsequent app launches, call `authenticateWithBiometric()`
 * 3. Use the returned key to decrypt the vault directly
 *
 * @returns Object containing biometric state and actions
 *
 * @example
 * ```tsx
 * function LockScreen() {
 *   const {
 *     state,
 *     authenticateWithBiometric,
 *     storeKeyForBiometric,
 *     enableBiometric,
 *     setEnableBiometric,
 *   } = useBiometricAuth();
 *
 *   // Show biometric button if available and key is stored
 *   const showBiometricButton = state.isAvailable &&
 *     state.hasStoredKey &&
 *     enableBiometric;
 *
 *   const handleBiometricUnlock = async () => {
 *     const keyJson = await authenticateWithBiometric();
 *     if (keyJson) {
 *       // Use keyJson to unlock vault without password
 *       const keyCache = JSON.parse(keyJson);
 *       // ... decrypt with keyCache
 *     }
 *   };
 *
 *   const handlePasswordUnlock = async (password: string) => {
 *     // After successful password unlock...
 *     const keyCache = await unlockAndGetKey(vault, password);
 *     // Store for future biometric unlock
 *     if (enableBiometric) {
 *       await storeKeyForBiometric(JSON.stringify(keyCache));
 *     }
 *   };
 * }
 * ```
 */
export function useBiometricAuth(): UseBiometricAuthReturn {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: null,
    hasStoredKey: false,
  });

  const [enableBiometric, setEnableBiometricState] = useState(false);

  // -------------------------------------------------------------------------
  // Check Device Capabilities
  // -------------------------------------------------------------------------

  /**
   * Checks device biometric capabilities and updates state.
   */
  const checkBiometricCapabilities = useCallback(async (): Promise<void> => {
    try {
      // Check if hardware supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      // Check if user has enrolled biometrics
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Check if we have a stored key
      let hasStoredKey = false;
      try {
        const storedKey = await SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE);
        hasStoredKey = storedKey !== null;
      } catch {
        // SecureStore may throw if biometric auth is required but fails
        hasStoredKey = false;
      }

      setState({
        isAvailable: hasHardware && isEnrolled,
        isEnrolled,
        biometricType: getBiometricType(supportedTypes),
        hasStoredKey,
      });
    } catch (error) {
      console.error('Failed to check biometric capabilities:', error);
      setState({
        isAvailable: false,
        isEnrolled: false,
        biometricType: null,
        hasStoredKey: false,
      });
    }
  }, []);

  /**
   * Loads the user's biometric preference from storage.
   */
  const loadBiometricPreference = useCallback(async (): Promise<void> => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setEnableBiometricState(enabled === 'true');
    } catch {
      setEnableBiometricState(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Initialize on Mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    checkBiometricCapabilities();
    loadBiometricPreference();
  }, [checkBiometricCapabilities, loadBiometricPreference]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * Stores the derived key securely for future biometric unlock.
   *
   * The key is stored in SecureStore with biometric protection enabled,
   * meaning the user must authenticate with biometrics to retrieve it.
   *
   * @param derivedKeyJson - JSON-serialized DerivedKeyCache object
   * @returns true if storage succeeded, false otherwise
   */
  const storeKeyForBiometric = useCallback(
    async (derivedKeyJson: string): Promise<boolean> => {
      try {
        await SecureStore.setItemAsync(BIOMETRIC_KEY_STORAGE, derivedKeyJson, {
          // Require biometric authentication to access
          requireAuthentication: true,
          // Authentication prompt message
          authenticationPrompt: BIOMETRIC_PROMPT_MESSAGE,
        });

        // Update state to reflect stored key
        setState((prev) => ({ ...prev, hasStoredKey: true }));

        return true;
      } catch (error) {
        console.error('Failed to store key for biometric:', error);
        return false;
      }
    },
    []
  );

  /**
   * Authenticates with biometrics and retrieves the stored key.
   *
   * This triggers the device's biometric prompt. If successful,
   * returns the stored derived key JSON which can be parsed
   * and used to decrypt the vault without PBKDF2.
   *
   * @returns The stored key JSON if successful, null otherwise
   */
  const authenticateWithBiometric = useCallback(async (): Promise<string | null> => {
    try {
      // First, verify biometrics are available
      if (!state.isAvailable) {
        console.warn('Biometric authentication not available');
        return null;
      }

      // Authenticate the user
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: BIOMETRIC_PROMPT_MESSAGE,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Don't allow PIN/password fallback
        fallbackLabel: '', // Hide fallback option
      });

      if (!result.success) {
        console.warn('Biometric authentication failed:', result.error);
        return null;
      }

      // Retrieve the stored key (this may trigger another biometric prompt
      // depending on the device, but SecureStore handles it)
      const storedKey = await SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE);

      if (!storedKey) {
        console.warn('No stored key found after successful biometric auth');
        return null;
      }

      return storedKey;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return null;
    }
  }, [state.isAvailable]);

  /**
   * Clears the stored biometric key.
   *
   * Call this when:
   * - User logs out
   * - User resets the wallet
   * - User disables biometric unlock
   * - Password is changed (key would be invalid)
   */
  const clearBiometricKey = useCallback(async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY_STORAGE);
      setState((prev) => ({ ...prev, hasStoredKey: false }));
    } catch (error) {
      console.error('Failed to clear biometric key:', error);
    }
  }, []);

  /**
   * Sets the user's biometric preference.
   *
   * When disabled, also clears any stored key for security.
   *
   * @param enabled - Whether biometric unlock should be enabled
   */
  const setEnableBiometric = useCallback(
    async (enabled: boolean): Promise<void> => {
      try {
        await SecureStore.setItemAsync(
          BIOMETRIC_ENABLED_KEY,
          enabled ? 'true' : 'false'
        );
        setEnableBiometricState(enabled);

        // If disabling, clear the stored key
        if (!enabled) {
          await clearBiometricKey();
        }
      } catch (error) {
        console.error('Failed to set biometric preference:', error);
      }
    },
    [clearBiometricKey]
  );

  /**
   * Refreshes the biometric state.
   *
   * Useful after app resumes from background or after
   * system biometric settings change.
   */
  const refreshState = useCallback(async (): Promise<void> => {
    await checkBiometricCapabilities();
    await loadBiometricPreference();
  }, [checkBiometricCapabilities, loadBiometricPreference]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    state,
    authenticateWithBiometric,
    storeKeyForBiometric,
    clearBiometricKey,
    enableBiometric,
    setEnableBiometric,
    refreshState,
  };
}

export default useBiometricAuth;
