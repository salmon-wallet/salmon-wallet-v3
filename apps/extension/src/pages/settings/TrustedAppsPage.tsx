import React, { useCallback } from 'react';
import { useAccountsContext, type TrustedAppItem } from '@salmon/shared';
import { TrustedAppsSelector } from '@/components';

export function TrustedAppsPage({ onBack }: { onBack: () => void }) {
  const [state, actions] = useAccountsContext();
  const { activeTrustedApps } = state;

  const trustedAppItems: TrustedAppItem[] = Object.entries(
    activeTrustedApps || {}
  ).map(([domain, app]) => ({
    domain,
    name: app.name,
    icon: app.icon,
  }));

  const handleRevoke = useCallback(
    (domain: string) => {
      actions.removeTrustedApp(domain);
    },
    [actions]
  );

  return (
    <TrustedAppsSelector
      apps={trustedAppItems}
      onRevokeApp={handleRevoke}
      onBack={onBack}
    />
  );
}
