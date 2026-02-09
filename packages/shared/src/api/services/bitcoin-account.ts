import { get } from '../client';
import { getPricesByPlatform } from './price';
import type {
  BitcoinBalanceItem,
  AccountTransaction,
  AccountTransactionListResponse,
  TransactionPaging,
  FetchBitcoinBalanceFn,
  FetchBitcoinPricesFn,
  FetchBitcoinTransactionFn,
  FetchBitcoinRecentTransactionsFn,
} from '../../blockchain/bitcoin/BitcoinAccount';

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
    uiAmount: token.amount / Math.pow(10, token.decimals),
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
