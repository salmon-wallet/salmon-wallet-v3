/**
 * Auth Layout - Stack navigator for onboarding/authentication flow
 *
 * Screens in order:
 * 1. index (welcome) - Initial screen with create/recover options
 * 2. recover - Recover wallet with seed phrase
 * 3. create - Create new wallet (shows seed phrase)
 * 4. password - Set password for wallet encryption
 * 5. success - Success confirmation after wallet creation
 * 6. derived-accounts - Select derived accounts to import
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Hide headers - we handle our own back buttons
        headerShown: false,
        // Use default iOS-style animations
        animation: 'slide_from_right',
        // Prevent gesture back on certain screens (handled per-screen)
        gestureEnabled: true,
      }}
    >
      {/* Welcome screen - entry point */}
      <Stack.Screen
        name="index"
        options={{
          // Can't go back from welcome
          gestureEnabled: false,
        }}
      />

      {/* Recover wallet with seed phrase */}
      <Stack.Screen name="recover" />

      {/* Create new wallet */}
      <Stack.Screen name="create" />

      {/* Set password */}
      <Stack.Screen
        name="password"
        options={{
          // Don't allow back gesture during password setup
          // to prevent accidentally losing progress
          gestureEnabled: false,
        }}
      />

      {/* Success confirmation */}
      <Stack.Screen
        name="success"
        options={{
          // Can't go back from success
          gestureEnabled: false,
        }}
      />

      {/* Derived accounts selection */}
      <Stack.Screen name="derived-accounts" />
    </Stack>
  );
}
