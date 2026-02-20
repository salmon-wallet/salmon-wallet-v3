/**
 * ChangeExplorerScreen - Block explorer selection route
 *
 * Thin route file that connects the ExplorerSelector component
 * with the accounts context and user config hook.
 */

import React, { useCallback } from 'react';
import { router } from 'expo-router';

import {
  useAccountsContext,
  useUserConfig,
  type ExplorerSelectorItem,
} from '@salmon/shared';
import { ExplorerSelector } from '../../../../src/components';

export default function ChangeExplorerScreen() {
  const [accountState] = useAccountsContext();
  const { networkId } = accountState;

  const { explorer, explorers, changeExplorer, isLoading } = useUserConfig({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: networkId?.split('-')[0] || 'solana',
      },
    },
  });

  const explorerItems: ExplorerSelectorItem[] = explorers.map((e) => ({
    key: e.key,
    name: e.name,
  }));

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectExplorer = useCallback(
    async (key: string) => {
      await changeExplorer(key);
      router.back();
    },
    [changeExplorer]
  );

  return (
    <ExplorerSelector
      explorers={explorerItems}
      activeExplorerName={explorer?.name || ''}
      onSelectExplorer={handleSelectExplorer}
      onBack={handleBack}
      loading={isLoading}
    />
  );
}
