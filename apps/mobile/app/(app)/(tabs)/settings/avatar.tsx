/**
 * AvatarScreen - Route file for Avatar / Profile Picture selection
 *
 * Thin wrapper that gathers account data, then renders the AvatarPicker component.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { useAccountsContext } from '@salmon/shared';
import { AvatarPicker } from '../../../../src/components';

export default function AvatarScreen() {
  const [accountState, accountActions] = useAccountsContext();
  const { activeAccount } = accountState;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSave = useCallback(
    async (avatarUrl: string) => {
      if (activeAccount) {
        await accountActions.editAccount(activeAccount.id, { avatar: avatarUrl });
      }
      router.back();
    },
    [activeAccount, accountActions],
  );

  if (!activeAccount) return null;

  return (
    <AvatarPicker
      currentAvatarUrl={activeAccount.avatar}
      account={activeAccount}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
