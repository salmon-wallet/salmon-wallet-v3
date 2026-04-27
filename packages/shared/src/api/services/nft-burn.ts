/**
 * NFT Burn Service
 *
 * Provides serialized transactions for NFT burn operations.
 *
 * API Endpoints:
 * - POST /v1/{networkId}/nft/{mintAddress}?owner={owner} - Create burn transaction
 */

import { apiClient } from '../client';
import type { SolanaNetworkId } from '../../types/blockchain';
import type {
  BurnNftParams,
  MarketplaceTransactionResponse as TransactionResponse,
} from '../../types/nft';

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
    undefined,
    {
      params: {
        owner: ownerAddress,
      },
    }
  );

  if (!data?.transaction && !data?.transactions?.length) {
    throw new Error('Burn transaction was not returned by the API');
  }

  return data;
}
