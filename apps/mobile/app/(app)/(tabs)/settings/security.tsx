/**
 * SecurityScreen - Route file for security settings
 *
 * Thin wrapper that gathers biometric state and renders the SecurityPage component.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { SecurityPage } from '../../../../src/components/SecurityPage';
import { useBiometricAuth } from '../../../../hooks/useBiometricAuth';

export default function SecurityScreen() {
  const {
    state: biometricState,
    enableBiometric,
    setEnableBiometric,
    storeKeyForBiometric,
  } = useBiometricAuth();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleToggleBiometric = useCallback(
    async (enabled: boolean) => {
      await setEnableBiometric(enabled);
    },
    [setEnableBiometric],
  );

  return (
    <SecurityPage
      onBack={handleBack}
      isBiometricAvailable={biometricState.isAvailable && biometricState.isEnrolled}
      isBiometricEnabled={enableBiometric}
      onToggleBiometric={handleToggleBiometric}
    />
  );
}
