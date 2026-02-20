/**
 * ChangeNetworkScreen - Network selection route
 *
 * Thin route file that connects the NetworkSelector component
 * with the accounts context and available networks hook.
 */

import React, { useCallback, useMemo } from 'react';
import { router } from 'expo-router';

import {
  useAccountsContext,
  useAvailableNetworks,
  type NetworkSelectorItem,
} from '@salmon/shared';
import { NetworkSelector } from '../../../../src/components';

export default function ChangeNetworkScreen() {
  const [accountState, accountActions] = useAccountsContext();
  const { activeAccount, networkId } = accountState;

  const { allNetworks, isLoading } = useAvailableNetworks({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: networkId?.split('-')[0] || 'solana',
      },
    },
  });

  // Filter to networks the user actually has accounts for
  const userNetworks = useMemo(() => {
    if (!activeAccount?.networksAccounts) return allNetworks;
    const userNetworkIds = Object.keys(activeAccount.networksAccounts);
    return allNetworks.filter((n) => userNetworkIds.includes(n.id));
  }, [allNetworks, activeAccount]);

  const networkItems: NetworkSelectorItem[] = useMemo(
    () =>
      userNetworks.map((n) => ({
        id: n.id,
        name: n.name,
        blockchain: n.id.split('-')[0],
      })),
    [userNetworks]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectNetwork = useCallback(
    (id: string) => {
      accountActions.changeNetwork(id);
      router.back();
    },
    [accountActions]
  );

  return (
    <NetworkSelector
      networks={networkItems}
      activeNetworkId={networkId || ''}
      onSelectNetwork={handleSelectNetwork}
      onBack={handleBack}
      loading={isLoading}
    />
  );
}
