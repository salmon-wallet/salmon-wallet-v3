/**
 * AccountsScreen - Route file for account management
 *
 * Thin wrapper that gathers account data and renders the AccountsPage component.
 */

import React, { useCallback } from 'react';
import { router, type Href } from 'expo-router';
import { useAccountsContext } from '@salmon/shared';
import { AccountsPage } from '../../../../src/components/AccountsPage';

export default function AccountsScreen() {
  const [accountState, accountActions] = useAccountsContext();
  const { accounts, activeAccount } = accountState;

  const handleSelectAccount = useCallback(
    (accountId: string) => {
      accountActions.changeAccount(accountId);
    },
    [accountActions],
  );

  const handleEditAccount = useCallback(
    (accountId: string) => {
      router.push({
        pathname: '/(app)/(tabs)/settings/account-edit',
        params: { accountId },
      } as unknown as Href);
    },
    [],
  );

  const handleDeleteAccount = useCallback(
    (accountId: string) => {
      accountActions.removeAccount(accountId);
    },
    [accountActions],
  );

  const handleAddAccount = useCallback(() => {
    router.push('/(app)/(tabs)/settings/account-add' as Href);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <AccountsPage
      accounts={accounts}
      activeAccountId={activeAccount?.id || ''}
      onSelectAccount={handleSelectAccount}
      onEditAccount={handleEditAccount}
      onDeleteAccount={handleDeleteAccount}
      onAddAccount={handleAddAccount}
      onBack={handleBack}
    />
  );
}
