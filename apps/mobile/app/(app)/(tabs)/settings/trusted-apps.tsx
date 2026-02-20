/**
 * TrustedAppsScreen - Connected dApps management route
 *
 * Thin route file that connects the TrustedAppsSelector component
 * with the accounts context for trusted app data.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';

import {
  useAccountsContext,
  type TrustedAppItem,
} from '@salmon/shared';
import { TrustedAppsSelector } from '../../../../src/components';

export default function TrustedAppsScreen() {
  const [accountState, accountActions] = useAccountsContext();
  const { activeTrustedApps } = accountState;

  const trustedAppItems: TrustedAppItem[] = Object.entries(
    activeTrustedApps || {}
  ).map(([domain, app]) => ({
    domain,
    name: app.name,
    icon: app.icon,
  }));

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleRevokeApp = useCallback(
    async (domain: string) => {
      await accountActions.removeTrustedApp(domain);
    },
    [accountActions]
  );

  return (
    <TrustedAppsSelector
      apps={trustedAppItems}
      onRevokeApp={handleRevokeApp}
      onBack={handleBack}
    />
  );
}
