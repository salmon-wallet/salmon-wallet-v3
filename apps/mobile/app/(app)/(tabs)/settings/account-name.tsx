/**
 * AccountNameScreen - Route file for editing account name
 *
 * Thin wrapper that retrieves account data and renders the AccountNamePage component.
 */

import React, { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAccountsContext } from '@salmon/shared';
import { AccountNamePage } from '../../../../src/components/AccountNamePage';

export default function AccountNameScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [accountState, accountActions] = useAccountsContext();

  const account = accountState.accounts.find((a) => a.id === accountId) || accountState.activeAccount;

  const handleSave = useCallback(
    async (name: string) => {
      if (account) {
        await accountActions.editAccount(account.id, { name });
      }
      router.back();
    },
    [account, accountActions],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!account) return null;

  return (
    <AccountNamePage
      currentName={account.name}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
