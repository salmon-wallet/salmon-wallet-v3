/**
 * Hook for getting available networks filtered by developer mode.
 *
 * This hook provides:
 * - Network lists filtered by the developerNetworks user setting
 * - Networks grouped by blockchain (solana, bitcoin, ethereum)
 * - A flat list of all available networks
 *
 * @module hooks/useAvailableNetworks
 */

import { useMemo, useState, useEffect } from 'react';
import { useUserConfig, type UseUserConfigParams } from './useUserConfig';
import { SOLANA_NETWORKS } from '../blockchain/solana/factory';
import { BITCOIN_NETWORKS } from '../blockchain/bitcoin/factory';
import { ETHEREUM_NETWORKS } from '../blockchain/ethereum/factory';
import type { AnyNetwork, NetworksByBlockchain } from '../types/blockchain';
import { MAINNET_NETWORK_IDS, sortNetworks, filterNetworks } from '../utils/network';
import { getNetworks } from '../api/services/network';

// Re-export domain types for backward compatibility
export type { AnyNetwork, NetworksByBlockchain } from '../types/blockchain';

/**
 * Return type for the useAvailableNetworks hook.
 */
export interface UseAvailableNetworksResult {
  /** Networks grouped by blockchain */
  networks: NetworksByBlockchain;
  /** Flat list of all available networks */
  allNetworks: AnyNetwork[];
  /** Whether developer networks are currently enabled */
  developerNetworks: boolean;
  /** Whether the configuration is still loading */
  isLoading: boolean;
  /** Whether backend network configs have been fetched and merged (or failed gracefully) */
  networksReady: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Desired network order for each blockchain.
 * Mainnet networks are shown first, followed by dev/test networks.
 */
const NETWORK_ORDER = {
  solana: ['solana-mainnet', 'solana-devnet'],
  bitcoin: ['bitcoin-mainnet', 'bitcoin-testnet'],
  ethereum: ['ethereum-mainnet', 'ethereum-sepolia'],
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for getting available networks filtered by developer mode.
 *
 * When developerNetworks is FALSE (default), only mainnet networks are returned.
 * When developerNetworks is TRUE, all networks (mainnet + testnet + devnet) are returned.
 *
 * @param params - Hook parameters including the active blockchain account
 * @returns Available networks and related state
 *
 * @example
 * ```typescript
 * import { useAvailableNetworks } from '@salmon/shared/hooks';
 *
 * function NetworkSelector() {
 *   const activeAccount = { network: { environment: 'mainnet-beta', blockchain: 'solana' } };
 *
 *   const {
 *     networks,
 *     allNetworks,
 *     developerNetworks,
 *     isLoading,
 *   } = useAvailableNetworks({ activeBlockchainAccount: activeAccount });
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <View>
 *       <Text>Solana Networks:</Text>
 *       {networks.solana.map(network => (
 *         <Text key={network.id}>{network.name}</Text>
 *       ))}
 *
 *       <Text>Bitcoin Networks:</Text>
 *       {networks.bitcoin.map(network => (
 *         <Text key={network.id}>{network.name}</Text>
 *       ))}
 *
 *       <Text>Ethereum Networks:</Text>
 *       {networks.ethereum.map(network => (
 *         <Text key={network.id}>{network.name}</Text>
 *       ))}
 *
 *       <Text>Developer Mode: {developerNetworks ? 'ON' : 'OFF'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useAvailableNetworks(
  params: UseUserConfigParams
): UseAvailableNetworksResult {
  const { developerNetworks, isLoading } = useUserConfig(params);
  const [apiMerged, setApiMerged] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNetworks()
      .then((apiNetworks) => {
        if (cancelled) return;
        for (const net of apiNetworks) {
          const { id, blockchain, config: cfg } = net;
          if (!cfg) continue;

          const chain = blockchain?.toLowerCase();
          if (chain === 'solana' && SOLANA_NETWORKS[id]) {
            if (cfg.nodeUrl) {
              SOLANA_NETWORKS[id].config.nodeUrl = cfg.nodeUrl as string;
            }
          } else if (chain === 'ethereum' && ETHEREUM_NETWORKS[id]) {
            if (cfg.rpcUrl) {
              ETHEREUM_NETWORKS[id].config.rpcUrl = cfg.rpcUrl as string;
            }
          } else if (chain === 'bitcoin' && BITCOIN_NETWORKS[id]) {
            if (cfg.apiUrl) {
              BITCOIN_NETWORKS[id].config.apiUrl = cfg.apiUrl as string;
            }
          }
        }
        setApiMerged(true);
      })
      .catch(() => {
        // Silently fall back to hardcoded defaults
        if (!cancelled) setApiMerged(true);
      });
    return () => { cancelled = true; };
  }, []);

  const networks = useMemo<NetworksByBlockchain>(() => {
    return {
      solana: filterNetworks(
        SOLANA_NETWORKS,
        MAINNET_NETWORK_IDS.solana,
        developerNetworks,
        NETWORK_ORDER.solana
      ),
      bitcoin: filterNetworks(
        BITCOIN_NETWORKS,
        MAINNET_NETWORK_IDS.bitcoin,
        developerNetworks,
        NETWORK_ORDER.bitcoin
      ),
      ethereum: filterNetworks(
        ETHEREUM_NETWORKS,
        MAINNET_NETWORK_IDS.ethereum,
        developerNetworks,
        NETWORK_ORDER.ethereum
      ),
    };
  }, [developerNetworks, apiMerged]);

  const allNetworks = useMemo<AnyNetwork[]>(() => {
    return [
      ...networks.solana,
      ...networks.bitcoin,
      ...networks.ethereum,
    ];
  }, [networks]);

  return {
    networks,
    allNetworks,
    developerNetworks,
    isLoading,
    networksReady: apiMerged,
  };
}

export default useAvailableNetworks;
