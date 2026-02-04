/**
 * useAdjacentBalances Hook
 *
 * Preloads balance data for adjacent blockchain cards in the carousel.
 * This ensures smooth transitions when users swipe between networks by having
 * the next/previous card's data ready before the animation reveals it.
 *
 * Preloading Strategy:
 * - Active card (index): Full balance data loaded
 * - Adjacent cards (index ± 1): Balance data preloaded
 * - Other cards: Show undefined (lazy load when needed)
 *
 * In production (3 cards): All cards are preloaded
 * In developer mode (9 cards): Only 3 cards (active + adjacent) are preloaded at a time
 *
 * Note: This hook creates blockchain account instances but does NOT fetch balance data itself.
 * Balance fetching is handled by the useBalance hook for the active network only.
 * This hook provides the structure for future multi-network balance fetching.
 *
 * @module hooks/useAdjacentBalances
 */

import { useMemo } from 'react';
import type { Account } from './useAccounts';
import type { AnyNetwork } from './useAvailableNetworks';
import type { BlockchainAccount } from './useBalance';

// ============================================================================
// Types
// ============================================================================

/**
 * Adjacent network accounts for preloading
 */
export interface AdjacentAccounts {
  /** Previous network account (index - 1) */
  prevAccount: BlockchainAccount | undefined;
  /** Current network account (index) */
  currentAccount: BlockchainAccount | undefined;
  /** Next network account (index + 1) */
  nextAccount: BlockchainAccount | undefined;
}

/**
 * Parameters for the useAdjacentBalances hook
 */
export interface UseAdjacentBalancesParams {
  /** Current active account with all network accounts */
  activeAccount: Account | undefined;
  /** List of all available networks */
  allNetworks: AnyNetwork[];
  /** Current active carousel index */
  activeIndex: number;
}

/**
 * Return type for the useAdjacentBalances hook
 */
export interface UseAdjacentBalancesResult {
  /** Blockchain accounts for adjacent networks */
  adjacentAccounts: AdjacentAccounts;
  /** Whether a network index should be preloaded */
  shouldPreload: (index: number) => boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a network index should be preloaded based on the active index.
 * Preloads the active card and its immediate neighbors (±1).
 */
function shouldPreloadNetwork(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= 1;
}

/**
 * Gets the blockchain account for a specific network from the active account.
 * Returns undefined if the network doesn't have an account.
 */
function getNetworkAccount(
  activeAccount: Account | undefined,
  network: AnyNetwork | undefined
): BlockchainAccount | undefined {
  if (!activeAccount || !network) {
    return undefined;
  }

  // Safety check: Ensure networksAccounts exists
  if (!activeAccount.networksAccounts) {
    return undefined;
  }

  // Access the account for this network
  const networkAccounts = activeAccount.networksAccounts[network.id];
  if (!networkAccounts || networkAccounts.length === 0) {
    return undefined;
  }

  // Return the first non-null account (typically index 0)
  return networkAccounts.find(account => account !== null);
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for getting blockchain accounts for adjacent networks in the carousel.
 *
 * This hook provides the blockchain account instances for the previous, current,
 * and next networks based on the active carousel index. These accounts can then
 * be used with useBalance or other balance-fetching mechanisms.
 *
 * @param params - Hook configuration parameters
 * @returns Adjacent blockchain accounts and preload helper
 *
 * @example
 * ```tsx
 * const { adjacentAccounts, shouldPreload } = useAdjacentBalances({
 *   activeAccount,
 *   allNetworks,
 *   activeIndex: activeBlockchainIndex,
 * });
 *
 * // Use adjacentAccounts.currentAccount with useBalance
 * // Use shouldPreload(index) to determine if a network should show data
 * ```
 */
export function useAdjacentBalances(
  params: UseAdjacentBalancesParams
): UseAdjacentBalancesResult {
  const {
    activeAccount,
    allNetworks,
    activeIndex,
  } = params;

  // Get blockchain accounts for adjacent networks
  const adjacentAccounts = useMemo<AdjacentAccounts>(() => {
    // Early return with safe defaults if activeAccount is undefined
    if (!activeAccount) {
      return {
        prevAccount: undefined,
        currentAccount: undefined,
        nextAccount: undefined,
      };
    }

    const prevNetwork = allNetworks[activeIndex - 1];
    const currentNetwork = allNetworks[activeIndex];
    const nextNetwork = allNetworks[activeIndex + 1];

    return {
      prevAccount: getNetworkAccount(activeAccount, prevNetwork),
      currentAccount: getNetworkAccount(activeAccount, currentNetwork),
      nextAccount: getNetworkAccount(activeAccount, nextNetwork),
    };
  }, [activeAccount, allNetworks, activeIndex]);

  // Create a helper function to check if an index should be preloaded
  const shouldPreload = useMemo(() => {
    return (index: number) => shouldPreloadNetwork(index, activeIndex);
  }, [activeIndex]);

  return {
    adjacentAccounts,
    shouldPreload,
  };
}

export default useAdjacentBalances;
