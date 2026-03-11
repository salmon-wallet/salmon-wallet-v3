import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountsContext } from '@salmon/shared';
import { SelectOptionsPage } from '@salmon/ui';
import { useAuthFlow } from './AuthFlowContext';

export function SelectPage(): React.ReactElement {
  const navigate = useNavigate();
  const [state] = useAccountsContext();
  const { setFlowType } = useAuthFlow();
  const hasAccounts = state.accounts.length > 0;

  const handleCreate = useCallback(() => {
    setFlowType('create');
    navigate('/auth/create');
  }, [navigate, setFlowType]);

  const handleRecover = useCallback(() => {
    setFlowType('recover');
    navigate('/auth/recover');
  }, [navigate, setFlowType]);

  const handleAccess = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  return (
    <SelectOptionsPage
      onCreateWallet={handleCreate}
      onRecoverWallet={handleRecover}
      hasAccounts={hasAccounts}
      onAccessExisting={hasAccounts ? handleAccess : undefined}
    />
  );
}
