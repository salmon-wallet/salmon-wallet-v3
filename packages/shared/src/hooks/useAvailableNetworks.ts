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
import { SOLANA_NETWORKS } from '../blockchain/solana/networks';
import { BITCOIN_NETWORKS } from '../blockchain/bitcoin/networks';
import { ETHEREUM_NETWORKS } from '../blockchain/ethereum/networks';
import type { AnyNetwork, NetworksByBlockchain } from '../types/blockchain';
import { MAINNET_NETWORK_IDS, filterNetworks } from '../utils/network';
import { isBlockchainEnabled } from '../config/blockchains';
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
// Standalone merge function
// ============================================================================

/**
 * Fetches network configs from the backend API and merges them into the
 * global SOLANA_NETWORKS, ETHEREUM_NETWORKS, and BITCOIN_NETWORKS objects.
 *
 * This can be called imperatively (e.g. before a derivation scan) or from
 * the useAvailableNetworks hook.  The underlying getNetworks() call is
 * promise-cached, so multiple calls are cheap.
 *
 * @returns true if the merge succeeded, false if it fell back to defaults
 */
export async function fetchAndMergeNetworkConfigs(): Promise<boolean> {
  try {
    const apiNetworks = await getNetworks();
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
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Parameters for useAvailableNetworks.
 * Extends UseUserConfigParams with an optional developerNetworks override.
 * When provided, the override takes precedence over the internal useUserConfig value,
 * allowing callers that already have a useUserConfig instance to avoid stale reads.
 */
export interface UseAvailableNetworksParams extends UseUserConfigParams {
  /** Override developerNetworks value (bypasses internal useUserConfig read) */
  developerNetworks?: boolean;
}

/**
 * Hook for getting available networks filtered by developer mode.
 *
 * When developerNetworks is FALSE (default), only mainnet networks are returned.
 * When developerNetworks is TRUE, all networks (mainnet + testnet + devnet) are returned.
 *
 * @param params - Hook parameters including the active blockchain account
 * @returns Available networks and related state
 */
export function useAvailableNetworks(
  params: UseAvailableNetworksParams
): UseAvailableNetworksResult {
  const { developerNetworks: configDeveloperNetworks, isLoading } = useUserConfig(params);
  const developerNetworks = params.developerNetworks ?? configDeveloperNetworks;
  const [apiMerged, setApiMerged] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAndMergeNetworkConfigs()
      .then((_success) => {
        if (!cancelled) setApiMerged(true);
      });
    return () => { cancelled = true; };
  }, []);

  const networks = useMemo<NetworksByBlockchain>(() => {
    return {
      solana: isBlockchainEnabled('solana') ? filterNetworks(
        SOLANA_NETWORKS,
        MAINNET_NETWORK_IDS.solana,
        developerNetworks,
        NETWORK_ORDER.solana
      ) : [],
      bitcoin: isBlockchainEnabled('bitcoin') ? filterNetworks(
        BITCOIN_NETWORKS,
        MAINNET_NETWORK_IDS.bitcoin,
        developerNetworks,
        NETWORK_ORDER.bitcoin
      ) : [],
      ethereum: isBlockchainEnabled('ethereum') ? filterNetworks(
        ETHEREUM_NETWORKS,
        MAINNET_NETWORK_IDS.ethereum,
        developerNetworks,
        NETWORK_ORDER.ethereum
      ) : [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apiMerged is an intentional cache-invalidation signal after fetchAndMergeNetworkConfigs completes
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
