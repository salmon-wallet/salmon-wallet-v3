/**
 * Marketplace Service
 * NFT marketplace operations using Hyperspace SDK via backend
 *
 * Provides serialized transactions for NFT marketplace operations:
 * - Listing NFTs for sale
 * - Removing listings
 * - Buying NFTs
 * - Placing and canceling bids
 * - Burning NFTs
 *
 * API Endpoints:
 * - GET /v1/{networkId}/nft/list-tx - Create listing transaction
 * - GET /v1/{networkId}/nft/unlist-tx - Remove listing transaction
 * - GET /v1/{networkId}/nft/buy-tx - Buy NFT transaction
 * - GET /v1/{networkId}/nft/bid-tx - Place bid transaction
 * - GET /v1/{networkId}/nft/cancel-bid-tx - Cancel bid transaction
 * - GET /v1/{networkId}/nft/listed/{ownerAddress} - Get user's active listings
 * - GET /v1/{networkId}/nft/bids/{ownerAddress} - Get user's active bids
 * - POST /v1/{networkId}/nft/{mintAddress}?owner={owner} - Create burn transaction
 */

import { apiClient, ApiError } from '../client';
import type { SolanaNetwork, SolanaNetworkId } from '../../types/blockchain';
import type {
  ListNftParams,
  UnlistNftParams,
  BuyNftParams,
  PlaceBidParams,
  CancelBidParams,
  BurnNftParams,
  MarketplaceTransactionResponse as TransactionResponse,
  NftListing,
  NftBid,
} from '../../types/nft';

// ============================================================================
// Marketplace Transaction Functions
// ============================================================================

/**
 * Create a transaction to list an NFT for sale
 *
 * Endpoint: GET /v1/{networkId}/nft/list-tx
 *
 * @param params - Listing parameters (tokenAddress, sellerAddress, price)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createListingTransaction(
  params: ListNftParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { tokenAddress, sellerAddress, price } = params;

  const { data } = await apiClient.get<TransactionResponse>(
    `/v1/${networkId}/nft/list-tx`,
    {
      params: {
        tokenAddress,
        sellerAddress,
        price,
      },
    }
  );

  return data;
}

/**
 * Create a transaction to remove an NFT listing
 *
 * Endpoint: GET /v1/{networkId}/nft/unlist-tx
 *
 * @param params - Unlist parameters (tokenAddress, sellerAddress)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createUnlistTransaction(
  params: UnlistNftParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { tokenAddress, sellerAddress } = params;

  const { data } = await apiClient.get<TransactionResponse>(
    `/v1/${networkId}/nft/unlist-tx`,
    {
      params: {
        tokenAddress,
        sellerAddress,
      },
    }
  );

  return data;
}

/**
 * Create a transaction to buy a listed NFT
 *
 * Endpoint: GET /v1/{networkId}/nft/buy-tx
 *
 * @param params - Buy parameters (tokenAddress, buyerAddress, price)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createBuyTransaction(
  params: BuyNftParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { tokenAddress, buyerAddress, price } = params;

  const { data } = await apiClient.get<TransactionResponse>(
    `/v1/${networkId}/nft/buy-tx`,
    {
      params: {
        tokenAddress,
        buyerAddress,
        price,
      },
    }
  );

  return data;
}

/**
 * Create a transaction to place a bid on an NFT
 *
 * Endpoint: GET /v1/{networkId}/nft/bid-tx
 *
 * @param params - Bid parameters (tokenAddress, buyerAddress, price)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createBidTransaction(
  params: PlaceBidParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { tokenAddress, buyerAddress, price } = params;

  const { data } = await apiClient.get<TransactionResponse>(
    `/v1/${networkId}/nft/bid-tx`,
    {
      params: {
        tokenAddress,
        buyerAddress,
        price,
      },
    }
  );

  return data;
}

/**
 * Create a transaction to cancel a bid on an NFT
 *
 * Endpoint: GET /v1/{networkId}/nft/cancel-bid-tx
 *
 * @param params - Cancel bid parameters (tokenAddress, buyerAddress)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createCancelBidTransaction(
  params: CancelBidParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { tokenAddress, buyerAddress } = params;

  const { data } = await apiClient.get<TransactionResponse>(
    `/v1/${networkId}/nft/cancel-bid-tx`,
    {
      params: {
        tokenAddress,
        buyerAddress,
      },
    }
  );

  return data;
}

/**
 * Create a transaction to burn an NFT
 *
 * Endpoint: POST /v1/{networkId}/nft/{mintAddress}?owner={owner}
 *
 * @param params - Burn parameters (mintAddress, ownerAddress)
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Serialized transaction ready for signing
 */
export async function createBurnTransaction(
  params: BurnNftParams,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<TransactionResponse> {
  const { mintAddress, ownerAddress } = params;

  const { data } = await apiClient.post<TransactionResponse>(
    `/v1/${networkId}/nft/${mintAddress}`,
    null,
    {
      params: {
        owner: ownerAddress,
      },
    }
  );

  return data;
}

// ============================================================================
// Marketplace Query Functions
// ============================================================================

/**
 * Get all active listings for a user
 *
 * Endpoint: GET /v1/{networkId}/nft/listed/{ownerAddress}
 *
 * @param ownerAddress - Owner's wallet address
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Array of NFT listings
 */
export async function getUserListings(
  ownerAddress: string,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<NftListing[]> {
  try {
    const { data } = await apiClient.get<NftListing[]>(
      `/v1/${networkId}/nft/listed/${ownerAddress}`
    );

    return data || [];
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      // No listings found, return empty array
      return [];
    }
    console.error('[MarketplaceService] Failed to fetch user listings:', error);
    throw error;
  }
}

/**
 * Get all active bids placed by a user
 *
 * Endpoint: GET /v1/{networkId}/nft/bids/{ownerAddress}
 *
 * @param ownerAddress - Bidder's wallet address
 * @param networkId - Network identifier (default: 'solana-mainnet')
 * @returns Array of NFT bids
 */
export async function getUserBids(
  ownerAddress: string,
  networkId: SolanaNetworkId = 'solana-mainnet'
): Promise<NftBid[]> {
  try {
    const { data } = await apiClient.get<NftBid[]>(
      `/v1/${networkId}/nft/bids/${ownerAddress}`
    );

    return data || [];
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound()) {
      // No bids found, return empty array
      return [];
    }
    console.error('[MarketplaceService] Failed to fetch user bids:', error);
    throw error;
  }
}

// ============================================================================
// Collection & Marketplace Query Functions
// ============================================================================

/**
 * Fetches collection group by filter type
 *
 * @param network - The network configuration object
 * @param filterType - Filter type (e.g., 'trending', 'top')
 * @returns Collection group data or null
 */
export async function getCollectionGroupByFilter(
  network: SolanaNetwork,
  filterType: string
): Promise<unknown | null> {
  try {
    const { data } = await apiClient.get(
      `/v1/${network.id}/nft/hyperspace/collections/${filterType}`
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches a collection by ID
 *
 * @param network - The network configuration object
 * @param collectionId - The collection ID
 * @returns Collection data or null
 */
export async function getCollectionById(
  network: SolanaNetwork,
  collectionId: string
): Promise<unknown | null> {
  try {
    const { data } = await apiClient.get(
      `/v1/${network.id}/nft/hyperspace/collection/${collectionId}`
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches collection items by ID with pagination
 *
 * @param network - The network configuration object
 * @param collectionId - The collection ID
 * @param pageNumber - Page number for pagination
 * @returns Collection items or null
 */
export async function getCollectionItemsById(
  network: SolanaNetwork,
  collectionId: string,
  pageNumber: number
): Promise<unknown | null> {
  try {
    const { data } = await apiClient.get(
      `/v1/${network.id}/nft/hyperspace/collection/${collectionId}/items/${pageNumber}`
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches listed NFTs by owner address
 *
 * @param network - The network configuration object
 * @param ownerAddress - The owner's address
 * @returns Listed NFTs or null
 */
export async function getListedByOwner(
  network: SolanaNetwork,
  ownerAddress: string
): Promise<unknown | null> {
  try {
    const { data } = await apiClient.get(
      `/v1/${network.id}/nft/listed/${ownerAddress}`
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches bids by owner address
 *
 * @param network - The network configuration object
 * @param ownerAddress - The owner's address
 * @returns Bids data or null
 */
export async function getBidsByOwner(
  network: SolanaNetwork,
  ownerAddress: string
): Promise<unknown | null> {
  try {
    const { data } = await apiClient.get(
      `/v1/${network.id}/nft/bids/${ownerAddress}`
    );
    return data;
  } catch {
    return null;
  }
}
