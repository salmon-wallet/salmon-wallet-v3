/**
 * AddressBookEditScreen - Edit existing contact route
 */

import React, { useCallback, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import {
  useAccountsContext,
  useAvailableNetworks,
  useAddressbook,
  type NetworkAdapter,
  type AddressBookNetwork,
  type AddressBookItem,
  type AddressInput,
  type BlockchainType,
} from '@salmon/shared';
import { AddressBookEdit } from '../../../../src/components';

export default function AddressBookEditScreen() {
  const params = useLocalSearchParams<{
    name: string;
    address: string;
    networkId: string;
    networkName: string;
    domain: string;
  }>();

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

  const [, { editContact }] = useAddressbook({ networkAdapter });

  const contact: AddressBookItem = useMemo(() => ({
    name: params.name || '',
    address: params.address || '',
    networkId: params.networkId || 'solana-mainnet',
    networkName: params.networkName || '',
    domain: params.domain || undefined,
  }), [params.name, params.address, params.networkId, params.networkName, params.domain]);

  const activeBlockchain = (contact.networkId || 'solana-mainnet').split('-')[0];

  const handleSave = useCallback(
    async (originalAddress: string, input: AddressInput) => {
      await editContact(originalAddress, input);
      router.back();
    },
    [editContact],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <AddressBookEdit
      contact={contact}
      activeBlockchain={activeBlockchain}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
