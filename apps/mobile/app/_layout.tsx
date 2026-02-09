// Note: Crypto polyfills are now loaded in index.js (the app entry point)
// This ensures they're available BEFORE expo-router loads any modules

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { colors } from '@salmon/shared';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { LockScreenOverlay } from '@salmon/ui';
import { I18nProvider } from '../src/i18n';
import { AccountsProvider, useAccountsContext, getStashItem, type DerivedKeyCache } from '@salmon/shared';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('@salmon/assets/src/fonts/SpaceMono-Regular.ttf'),
    DMSansBold: require('@salmon/assets/src/fonts/DMSans-Bold.ttf'),
    DMSansMedium: require('@salmon/assets/src/fonts/DMSans-Medium.ttf'),
    DMSansRegular: require('@salmon/assets/src/fonts/DMSans-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AccountsProvider>
      <RootLayoutNav />
    </AccountsProvider>
  );
}

// Custom dark theme with app background color matching header
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background.primary, // #10131c - matches header
    card: colors.background.primary,
  },
};

function RootLayoutNav() {
  // Always use dark theme for the wallet app
  const [state, actions] = useAccountsContext();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const biometric = useBiometricAuth();

  // Track if we've done the initial navigation
  const [hasNavigated, setHasNavigated] = useState(false);

  // Unlock handler for the lock screen overlay
  const handleUnlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const success = await actions.unlockAccounts(password);
      return success;
    } catch (err) {
      console.error('Unlock failed:', err);
      return false;
    }
  }, [actions]);

  // Biometric unlock handler - uses cached derived key to unlock without PBKDF2
  const handleUnlockWithKey = useCallback(async (keyJson: string): Promise<boolean> => {
    try {
      // Parse the cached key from the biometric-stored JSON
      const keyCache: DerivedKeyCache = JSON.parse(keyJson);
      // Use the cached key to unlock without expensive PBKDF2 derivation
      return await actions.unlockWithCachedKey(keyCache);
    } catch (error) {
      console.error('Biometric unlock failed:', error);
      return false;
    }
  }, [actions]);

  // Get derived key handler - retrieves the cached key after password unlock
  // This key is then stored securely for future biometric unlocks
  const handleGetDerivedKey = useCallback(async (): Promise<string | null> => {
    try {
      // The derived key is cached in stash during password unlock
      const keyCache = await getStashItem<DerivedKeyCache>('derived_key_cache');
      return keyCache ? JSON.stringify(keyCache) : null;
    } catch {
      return null;
    }
  }, []);

  // Remove all accounts handler for wallet reset
  const handleRemoveAllAccounts = useCallback(async () => {
    await actions.removeAllAccounts();
    router.replace('/(auth)');
  }, [actions]);

  useEffect(() => {
    // Don't navigate until the navigation state is ready and useAccounts is ready
    if (!navigationState?.key || !state.ready) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    const hasAccounts = state.accounts.length > 0;

    // Determine where the user should be
    if (!hasAccounts) {
      // No accounts exist - go to auth flow
      if (!inAuthGroup) {
        router.replace('/(auth)');
        setHasNavigated(true);
      }
    } else {
      // Accounts exist - but don't navigate to app if locked
      // The lock screen overlay will be shown first, and only after
      // successful unlock should we navigate to the app
      if (!inAppGroup && !hasNavigated && !state.locked) {
        // Only auto-navigate to app on initial load when not locked
        router.replace('/(app)/(tabs)');
        setHasNavigated(true);
      }
    }
  }, [state.ready, state.locked, state.accounts.length, segments, navigationState?.key, hasNavigated]);

  // Determine if lock screen should be shown
  const hasAccounts = state.accounts.length > 0;
  const shouldShowLockScreen = state.ready && hasAccounts && state.locked;

  return (
    <I18nProvider>
      <ThemeProvider value={CustomDarkTheme}>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth flow - onboarding screens */}
            <Stack.Screen
              name="(auth)"
              options={{
                // Prevent going back to auth after completing onboarding
                gestureEnabled: false,
              }}
            />

            {/* Main app - tabs and other screens */}
            <Stack.Screen
              name="(app)"
              options={{
                // Prevent going back
                gestureEnabled: false,
              }}
            />
          </Stack>

          {/* Lock screen overlay - renders on top of everything */}
          {hasAccounts && (
            <LockScreenOverlay
              locked={shouldShowLockScreen}
              onUnlock={handleUnlock}
              onUnlockWithKey={handleUnlockWithKey}
              onGetDerivedKey={handleGetDerivedKey}
              onRemoveAllAccounts={handleRemoveAllAccounts}
              biometric={biometric}
            />
          )}
        </View>
      </ThemeProvider>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
