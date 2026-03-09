import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAccountsContext } from '@salmon/shared';
import { LoadingScreen } from '@salmon/ui';

/**
 * Protects authenticated routes.
 * - Not ready → loading spinner
 * - Locked   → redirect to /lock
 * - No accounts → redirect to /auth/select
 * - Otherwise → render child route
 */
export function AuthGuard(): React.ReactElement {
  const [state] = useAccountsContext();

  if (!state.ready) {
    return <LoadingScreen visible />;
  }

  if (state.locked) {
    return <Navigate to="/lock" replace />;
  }

  if (state.accounts.length === 0) {
    return <Navigate to="/auth/select" replace />;
  }

  return <Outlet />;
}
