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

import { useMemo } from 'react';
import { useUserConfig, type UseUserConfigParams } from './useUserConfig';
import { SOLANA_NETWORKS } from '../blockchain/solana/factory';
import { BITCOIN_NETWORKS } from '../blockchain/bitcoin/factory';
import { ETHEREUM_NETWORKS } from '../blockchain/ethereum/factory';
import type { SolanaNetwork } from '../blockchain/solana/SolanaAccount';
import type { BitcoinNetwork } from '../blockchain/bitcoin/BitcoinAccount';
import type { EthereumNetwork } from '../blockchain/ethereum/EthereumAccount';

// ============================================================================
// Types
// ============================================================================

/**
 * A network from any supported blockchain.
 */
export type AnyNetwork = SolanaNetwork | BitcoinNetwork | EthereumNetwork;

/**
 * Networks grouped by blockchain.
 */
export interface NetworksByBlockchain {
  /** Available Solana networks */
  solana: SolanaNetwork[];
  /** Available Bitcoin networks */
  bitcoin: BitcoinNetwork[];
  /** Available Ethereum networks */
  ethereum: EthereumNetwork[];
}

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
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Network IDs that are considered mainnet networks.
 * These are always shown regardless of developer mode setting.
 */
const MAINNET_NETWORK_IDS = {
  solana: ['mainnet-beta'],
  bitcoin: ['mainnet'],
  ethereum: ['mainnet'],
};

/**
 * Desired network order for each blockchain.
 * Mainnet networks are shown first, followed by dev/test networks.
 */
const NETWORK_ORDER = {
  solana: ['mainnet-beta', 'devnet'],
  bitcoin: ['bitcoin', 'bitcoin-testnet'],
  ethereum: ['ethereum', 'ethereum-sepolia'],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sorts networks according to a predefined order.
 * Networks not in the order list are placed at the end in their original order.
 */
function sortNetworks<T extends { id: string }>(
  networks: T[],
  order: string[]
): T[] {
  return networks.sort((a, b) => {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);

    // If both are in the order list, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only a is in the order list, it comes first
    if (aIndex !== -1) {
      return -1;
    }

    // If only b is in the order list, it comes first
    if (bIndex !== -1) {
      return 1;
    }

    // If neither is in the order list, maintain original order
    return 0;
  });
}

/**
 * Filters Solana networks based on whether developer mode is enabled.
 */
function filterSolanaNetworks(
  networks: Record<string, SolanaNetwork>,
  mainnetIds: string[],
  developerNetworks: boolean
): SolanaNetwork[] {
  const filtered = Object.entries(networks)
    .filter(([key, network]) => {
      if (developerNetworks) {
        return true;
      }
      return mainnetIds.includes(key) || mainnetIds.includes(network.id);
    })
    .map(([, network]) => network);

  return sortNetworks(filtered, NETWORK_ORDER.solana);
}

/**
 * Filters Bitcoin networks based on whether developer mode is enabled.
 */
function filterBitcoinNetworks(
  networks: Record<string, BitcoinNetwork>,
  mainnetIds: string[],
  developerNetworks: boolean
): BitcoinNetwork[] {
  const filtered = Object.entries(networks)
    .filter(([key, network]) => {
      if (developerNetworks) {
        return true;
      }
      return mainnetIds.includes(key) || mainnetIds.includes(network.id);
    })
    .map(([, network]) => network);

  return sortNetworks(filtered, NETWORK_ORDER.bitcoin);
}

/**
 * Filters Ethereum networks based on whether developer mode is enabled.
 */
function filterEthereumNetworks(
  networks: Record<string, EthereumNetwork>,
  mainnetIds: string[],
  developerNetworks: boolean
): EthereumNetwork[] {
  const filtered = Object.entries(networks)
    .filter(([key, network]) => {
      if (developerNetworks) {
        return true;
      }
      return mainnetIds.includes(key) || mainnetIds.includes(network.id);
    })
    .map(([, network]) => network);

  return sortNetworks(filtered, NETWORK_ORDER.ethereum);
}

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

  const networks = useMemo<NetworksByBlockchain>(() => {
    return {
      solana: filterSolanaNetworks(
        SOLANA_NETWORKS,
        MAINNET_NETWORK_IDS.solana,
        developerNetworks
      ),
      bitcoin: filterBitcoinNetworks(
        BITCOIN_NETWORKS,
        MAINNET_NETWORK_IDS.bitcoin,
        developerNetworks
      ),
      ethereum: filterEthereumNetworks(
        ETHEREUM_NETWORKS,
        MAINNET_NETWORK_IDS.ethereum,
        developerNetworks
      ),
    };
  }, [developerNetworks]);

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
  };
}

export default useAvailableNetworks;
