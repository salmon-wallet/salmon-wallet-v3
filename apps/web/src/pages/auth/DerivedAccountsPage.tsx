import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DerivedAccountsPage as AuthDerivedAccountsPage } from '@salmon/ui';
import { useAuthFlow } from './AuthFlowContext';

export function DerivedAccountsPage(): React.ReactElement {
  const navigate = useNavigate();
  const { reset } = useAuthFlow();

  const handleComplete = useCallback(() => {
    reset();
    navigate('/home', { replace: true });
  }, [navigate, reset]);

  const handleBack = useCallback(() => {
    navigate('/auth/success');
  }, [navigate]);

  return (
    <AuthDerivedAccountsPage
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
