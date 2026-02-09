// Bitcoin Account
export { BitcoinAccount, SATOSHIS_PER_BTC } from './BitcoinAccount';
export type {
  BitcoinNetwork,
  BitcoinNetworkConfig,
  BitcoinAccountOptions,
  BitcoinAccountBalance,
  BitcoinKeyPair,
  BitcoinEnvironment,
  // New types for v3 methods
  AddressValidationResult,
  BitcoinBalanceItem,
  BitcoinWalletBalance,
  TransactionPaging,
  AccountTransactionListResponse,
  AccountTransaction,
  AccountTransactionInput,
  AccountTransactionOutput,
  // DI function types
  FetchBitcoinBalanceFn,
  FetchBitcoinPricesFn,
  FetchBitcoinTransactionFn,
  FetchBitcoinRecentTransactionsFn,
} from './BitcoinAccount';

// Factory functions and utilities
export {
  createBitcoinAccount,
  createBitcoinAccountFromKeyPair,
  createBitcoinAccountFromWIF,
  deriveBitcoinAccounts,
  createKeyPairFromNode,
  mapEnvironmentToNetwork,
  getBitcoinDerivationPath,
  BITCOIN_COIN_TYPE,
  BITCOIN_TESTNET_COIN_TYPE,
  BITCOIN_NETWORKS,
} from './factory';
export type {
  BitcoinAccountApiFunctions,
  CreateBitcoinAccountOptions,
  DeriveBitcoinAccountsOptions,
} from './factory';

// Transfer functions
export {
  createTransferTransaction,
  confirmTransferTransaction,
  sendBitcoin,
  estimateBitcoinFee,
  getUtxos,
  getMaxSendableAmount,
  btcToSatoshis,
  satoshisToBtc,
  DEFAULT_FEE_RATE,
} from './transfer';
export type {
  UTXO,
  TransferTransactionResult,
  BroadcastResult,
  SigningKeyPair,
  FetchUtxosFn,
  BroadcastTransactionFn,
} from './transfer';
