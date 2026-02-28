import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAccountsContext } from '@salmon/shared';
import { LoadingScreen } from '@salmon/ui';

/**
 * Root "/" redirect logic based on wallet state.
 */
export function RootRedirect(): React.ReactElement {
  const [state] = useAccountsContext();

  if (!state.ready) {
    return <LoadingScreen visible />;
  }

  if (state.accounts.length === 0) {
    return <Navigate to="/auth/select" replace />;
  }

  if (state.locked) {
    return <Navigate to="/lock" replace />;
  }

  return <Navigate to="/home" replace />;
}
