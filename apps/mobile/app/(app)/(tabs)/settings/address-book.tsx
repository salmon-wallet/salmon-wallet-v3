/**
 * AddressBookScreen - Address book list route
 *
 * Thin route file that connects the AddressBookSelector component
 * with the accounts context and address book hook.
 */

import React, { useCallback, useMemo } from 'react';
import { router } from 'expo-router';

import {
  useAccountsContext,
  useAvailableNetworks,
  useAddressbook,
  type AddressBookItem,
  type NetworkAdapter,
  type AddressBookNetwork,
  type BlockchainType,
} from '@salmon/shared';
import { AddressBookSelector } from '../../../../src/components';

export default function AddressBookScreen() {
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

  const [{ contacts, isLoading }, { removeContact }] = useAddressbook({ networkAdapter });

  const contactItems: AddressBookItem[] = useMemo(
    () =>
      contacts.map((c) => ({
        name: c.name,
        address: c.address,
        networkId: c.network.id,
        networkName: c.network.name,
        domain: c.domain,
      })),
    [contacts],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAddContact = useCallback(() => {
    router.push('./address-book-add');
  }, []);

  const handleEditContact = useCallback((contact: AddressBookItem) => {
    router.push({
      pathname: './address-book-edit',
      params: {
        name: contact.name,
        address: contact.address,
        networkId: contact.networkId,
        networkName: contact.networkName,
        domain: contact.domain || '',
      },
    });
  }, []);

  const handleRemoveContact = useCallback(
    async (address: string) => {
      await removeContact(address);
    },
    [removeContact],
  );

  return (
    <AddressBookSelector
      contacts={contactItems}
      activeNetworkId={networkId || 'solana-mainnet'}
      onAddContact={handleAddContact}
      onEditContact={handleEditContact}
      onRemoveContact={handleRemoveContact}
      onBack={handleBack}
      loading={isLoading}
    />
  );
}
