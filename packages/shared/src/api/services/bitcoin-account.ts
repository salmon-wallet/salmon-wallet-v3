import { get } from '../client';
import { getPricesByPlatform } from './price';
import { removeDecimals } from '../../utils/decimals';
import type {
  BitcoinBalanceItem,
  AccountTransaction,
  AccountTransactionListResponse,
  TransactionPaging,
  BitcoinAccountApiFunctions,
  FetchBitcoinBalanceFn,
  FetchBitcoinPricesFn,
  FetchBitcoinTransactionFn,
  FetchBitcoinRecentTransactionsFn,
} from '../../types/transfer';

export const fetchBitcoinAccountBalance: FetchBitcoinBalanceFn = async (
  networkId: string,
  address: string
): Promise<BitcoinBalanceItem[]> => {
  const url = `/v1/${networkId}/account/${address}/balance`;

  const data = await get<BitcoinBalanceItem[]>(url, {
    params: { include: 'logo' },
  });

  return data.map((token) => ({
    ...token,
    uiAmount: removeDecimals(token.amount, token.decimals),
    coingeckoId: 'bitcoin',
  }));
};

export const fetchBitcoinAccountPrices: FetchBitcoinPricesFn = async (
  platform: string
) => {
  return getPricesByPlatform(platform as Parameters<typeof getPricesByPlatform>[0]);
};

export const fetchBitcoinAccountTransaction: FetchBitcoinTransactionFn = async (
  networkId: string,
  address: string,
  txId: string
): Promise<AccountTransaction> => {
  const url = `/v1/${networkId}/account/${address}/transactions/${txId}`;
  return get<AccountTransaction>(url);
};

export const fetchBitcoinAccountRecentTransactions: FetchBitcoinRecentTransactionsFn = async (
  networkId: string,
  address: string,
  paging?: TransactionPaging
): Promise<AccountTransactionListResponse> => {
  const { nextPageToken, pageSize } = paging || {};

  const url = `/v1/${networkId}/account/${address}/transactions`;

  const params: Record<string, string | number> = {};
  if (nextPageToken) {
    params.pageToken = nextPageToken;
  }
  if (pageSize) {
    params.pageSize = pageSize;
  }

  return get<AccountTransactionListResponse>(url, { params });
};

/**
 * Pre-wired Bitcoin API functions for account creation.
 * Centralizes the dependency injection wiring so callers don't repeat it.
 */
export const bitcoinApiFunctions: BitcoinAccountApiFunctions = {
  fetchBalance: fetchBitcoinAccountBalance,
  fetchPrices: fetchBitcoinAccountPrices,
  fetchTransaction: fetchBitcoinAccountTransaction,
  fetchRecentTransactions: fetchBitcoinAccountRecentTransactions,
};
