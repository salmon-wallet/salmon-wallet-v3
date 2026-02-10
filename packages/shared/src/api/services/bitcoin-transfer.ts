/**
 * Bitcoin Transfer API Service
 *
 * Provides API implementations for Bitcoin transfer operations.
 * These functions are injected into the blockchain/bitcoin/transfer module
 * to decouple it from the API layer.
 */

import { get, post } from '../client';
import { getApiUrl } from '../config';
import type { UTXO, FetchUtxosFn, BroadcastTransactionFn } from '../../blockchain/bitcoin/transfer';

interface UTXOResponse {
  data: UTXO[];
  nextPageToken?: string;
}

export const fetchUtxos: FetchUtxosFn = async (networkId, address) => {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/v1/${networkId}/account/${address}/utxo`;

  const response = await get<UTXOResponse>(url, {
    params: { pageSize: 100 },
  });

  return response.data;
};

export const broadcastTransaction: BroadcastTransactionFn = async (networkId, address, serializedTx) => {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}/v1/${networkId}/account/${address}/transactions`;

  const response = await post<{ txId?: string; success?: boolean }>(url, {
    tx: serializedTx,
  });

  return {
    txId: response.txId,
    success: true,
  };
};
