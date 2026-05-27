import { useEffect } from 'react';

import { removeStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { getBlockchainFromNetworkId } from '../utils';
import type { ConnectionInfo } from '../types/account';
import type { BlockchainAccount } from '../types/blockchain';

interface UseAccountsConnectionParams {
  activeBlockchainAccount: BlockchainAccount | undefined;
  networkId: string | null;
}

export function useAccountsConnection({
  activeBlockchainAccount,
  networkId,
}: UseAccountsConnectionParams): void {
  useEffect(() => {
    const updateConnection = async (): Promise<void> => {
      if (activeBlockchainAccount && networkId) {
        const { network } = activeBlockchainAccount;
        const blockchainType = getBlockchainFromNetworkId(networkId);
        const connectionInfo: ConnectionInfo = {
          blockchain: blockchainType.toUpperCase(),
          environment: network.id,
          address: activeBlockchainAccount.getReceiveAddress(),
        };
        await setStorageItem(STORAGE_KEYS.CONNECTION, connectionInfo);
      } else {
        await removeStorageItem(STORAGE_KEYS.CONNECTION);
      }
    };

    updateConnection();
  }, [activeBlockchainAccount, networkId]);
}
