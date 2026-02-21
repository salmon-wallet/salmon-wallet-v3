/**
 * AccountAddScreen - Route file for adding a new account
 *
 * Thin wrapper that renders the AccountAddPage component.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { AccountAddPage } from '../../../../src/components/AccountAddPage';

export default function AccountAddScreen() {
  const handleComplete = useCallback(() => {
    router.back();
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return <AccountAddPage onComplete={handleComplete} onBack={handleBack} />;
}
