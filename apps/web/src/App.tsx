import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { WalletLayout } from '@salmon/ui';
import { useAccountsContext, useInactivityTimeout } from '@salmon/shared';
import { router } from './router';

function InactivityGuard({ children }: { children: React.ReactNode }) {
  const [state, actions] = useAccountsContext();

  useInactivityTimeout({
    timeoutMs: 5 * 60 * 1000,
    onTimeout: () => actions.lockAccounts(),
    enabled: state.ready && !state.locked && state.accounts.length > 0,
  });

  return <>{children}</>;
}

export function App(): React.ReactElement {
  return (
    <WalletLayout>
      <InactivityGuard>
        <RouterProvider router={router} />
      </InactivityGuard>
    </WalletLayout>
  );
}
