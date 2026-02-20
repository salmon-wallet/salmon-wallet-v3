/**
 * PrivateKeyScreen - Route file for Private Key Reveal
 *
 * Thin wrapper that gathers account data, network list, and biometric state,
 * then renders the PrivateKeyReveal component.
 */

import React, { useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import {
  useAccountsContext,
  buildNetworkListFromAccount,
} from '@salmon/shared';
import { PrivateKeyReveal } from '../../../../src/components';
import { useBiometricAuth } from '../../../../hooks/useBiometricAuth';

export default function PrivateKeyScreen() {
  const [accountState] = useAccountsContext();
  const { activeAccount } = accountState;
  const { state: biometricState, authenticateWithBiometric } = useBiometricAuth();

  const biometricAvailable = biometricState.isAvailable && biometricState.hasStoredKey;

  const networks = useMemo(
    () => buildNetworkListFromAccount(activeAccount),
    [activeAccount],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!activeAccount) return null;

  return (
    <PrivateKeyReveal
      networks={networks}
      activeAccount={activeAccount}
      onBack={handleBack}
      biometricAvailable={biometricAvailable}
      authenticateWithBiometric={authenticateWithBiometric}
    />
  );
}
