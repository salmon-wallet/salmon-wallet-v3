/**
 * AddressBookAddScreen - Add new contact route
 */

import React, { useCallback, useMemo } from 'react';
import { router } from 'expo-router';

import {
  useAccountsContext,
  useAvailableNetworks,
  useAddressbook,
  type NetworkAdapter,
  type AddressBookNetwork,
  type AddressInput,
  type BlockchainType,
} from '@salmon/shared';
import { AddressBookAdd } from '../../../../src/components';

export default function AddressBookAddScreen() {
  const [accountState] = useAccountsContext();
  const { networkId } = accountState;

  const { allNetworks } = useAvailableNetworks({
    activeBlockchainAccount: {
      network: {
        environment: (networkId || 'solana-mainnet') as 'solana-mainnet' | 'solana-devnet',
        blockchain: networkId?.split('-')[0] || 'solana',
      },
    },
  });

  const networkAdapter: NetworkAdapter = useMemo(() => ({
    getNetwork: async (id: string): Promise<AddressBookNetwork | undefined> => {
      const found = allNetworks.find((n) => n.id === id);
      if (!found) return undefined;
      return { id: found.id, name: found.name, blockchain: found.id.split('-')[0] as BlockchainType };
    },
    getNetworks: async (): Promise<AddressBookNetwork[]> =>
      allNetworks.map((n) => ({ id: n.id, name: n.name, blockchain: n.id.split('-')[0] as BlockchainType })),
  }), [allNetworks]);

  const [, { addContact }] = useAddressbook({ networkAdapter });

  const activeNetwork = allNetworks.find((n) => n.id === networkId) || allNetworks[0];
  const activeBlockchain = (networkId || 'solana-mainnet').split('-')[0];

  const handleSave = useCallback(
    async (input: AddressInput) => {
      await addContact(input);
      router.back();
    },
    [addContact],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <AddressBookAdd
      activeNetworkId={activeNetwork?.id || 'solana-mainnet'}
      activeNetworkName={activeNetwork?.name || 'Solana Mainnet'}
      activeBlockchain={activeBlockchain}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
