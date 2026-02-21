/**
 * AccountEditScreen - Route file for editing an account
 *
 * Thin wrapper that retrieves account data and renders the AccountEditPage component.
 */

import React, { useCallback } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useAccountsContext } from '@salmon/shared';
import { AccountEditPage } from '../../../../src/components/AccountEditPage';

export default function AccountEditScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [accountState] = useAccountsContext();

  const account = accountState.accounts.find((a) => a.id === accountId) || accountState.activeAccount;

  const handleEditName = useCallback(() => {
    if (account) {
      router.push({
        pathname: '/(app)/(tabs)/settings/account-name',
        params: { accountId: account.id },
      } as unknown as Href);
    }
  }, [account]);

  const handleEditAvatar = useCallback(() => {
    router.push('/(app)/(tabs)/settings/avatar' as Href);
  }, []);

  const handleBackupSeed = useCallback(() => {
    router.push('/(app)/(tabs)/settings/backup' as Href);
  }, []);

  const handleExportPrivateKey = useCallback(() => {
    router.push('/(app)/(tabs)/settings/privateKey' as Href);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!account) return null;

  return (
    <AccountEditPage
      account={account}
      onEditName={handleEditName}
      onEditAvatar={handleEditAvatar}
      onBackupSeed={handleBackupSeed}
      onExportPrivateKey={handleExportPrivateKey}
      onBack={handleBack}
    />
  );
}
