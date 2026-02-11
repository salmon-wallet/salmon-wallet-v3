/**
 * Hooks module for shared React hooks.
 *
 * @module hooks
 */

// Account management hook
export {
  useAccounts,
  default as useAccountsDefault,
} from './useAccounts';

// Types
export type {
  // Account types
  BlockchainAccount,
  NetworkPathIndexes,
  NetworksAccounts,
  StoredAccount,
  Account,
  // Trusted apps and tokens
  TrustedApp,
  TrustedApps,
  TokenInfo,
  CustomTokens,
  TokenToImport,
  // Connection
  ConnectionInfo,
  // Actions
  EditAccountParams,
  // Hook return types
  UseAccountsState,
  UseAccountsActions,
} from './useAccounts';

// User configuration hook
export {
  useUserConfig,
  default as useUserConfigDefault,
} from './useUserConfig';

export type {
  UserConfig,
  ActiveBlockchainAccount,
  UseUserConfigParams,
  UseUserConfigResult,
} from './useUserConfig';

// Token hook
export {
  useToken,
  default as useTokenDefault,
} from './useToken';

export type {
  TokenData,
  UseTokenOptions,
  UseTokenResult,
} from './useToken';

// Runtime detection hook
export { default as useRuntime } from './useRuntime';
export type { RuntimeInfo } from './types';
export { ADAPTER_PREFIXES } from './types';

// Language management hook
export { useLanguage, default as useLanguageDefault } from './useLanguage';
export type { UseLanguageResult } from './useLanguage';

// Inactivity timeout hook
export {
  useInactivityTimeout,
  default as useInactivityTimeoutDefault,
} from './useInactivityTimeout';
export type {
  UseInactivityTimeoutOptions,
  UseInactivityTimeoutResult,
} from './useInactivityTimeout';

// Available networks hook
export {
  useAvailableNetworks,
  default as useAvailableNetworksDefault,
} from './useAvailableNetworks';
export type {
  AnyNetwork,
  NetworksByBlockchain,
  UseAvailableNetworksResult,
} from './useAvailableNetworks';

// Balance hook
export {
  useBalance,
  default as useBalanceDefault,
} from './useBalance';
export type {
  NetworkId as BalanceNetworkId,
  UseBalanceOptions,
  UseBalanceResult,
} from './useBalance';

// Adjacent balances hook
export {
  useAdjacentBalances,
  default as useAdjacentBalancesDefault,
} from './useAdjacentBalances';
export type {
  AdjacentAccounts,
  UseAdjacentBalancesParams,
  UseAdjacentBalancesResult,
} from './useAdjacentBalances';

// Transactions hook
export {
  useTransactions,
  default as useTransactionsDefault,
} from './useTransactions';
export type {
  UseTransactionsOptions,
  UseTransactionsResult,
} from './useTransactions';

// Send transaction hook
export {
  useSendTransaction,
  default as useSendTransactionDefault,
} from './useSendTransaction';
export type {
  SendBlockchainType,
  SendBlockchainAccount,
  SendTokenInfo,
  SendTransactionParams,
  FeeEstimateResult,
  SendTransactionStatus,
  UseSendTransactionParams,
  UseSendTransactionResult,
} from './useSendTransaction';

// Swap hook
export {
  useSwap,
  default as useSwapDefault,
} from './useSwap';
export type {
  SwapStatus,
  UseSwapParams,
  GetQuoteParams,
  ParsedQuoteInfo,
  UseSwapResult,
} from './useSwap';

// Bridge hook
export {
  useBridge,
  default as useBridgeDefault,
} from './useBridge';
export type {
  BridgeOperationStatus,
  UseBridgeParams,
  BridgeEstimate,
  UseBridgeResult,
  BridgeToken,
  BridgeAvailableToken,
  BridgeFeaturedToken,
  BridgeExchange,
  BridgeTransaction,
  BridgeTransactionStatus,
} from './useBridge';

// Multi-chain tokens hook (for unified swap/bridge)
export {
  useMultiChainTokens,
  default as useMultiChainTokensDefault,
  getChainFromNetworkId,
  isSameChain,
  getSwapType,
} from './useMultiChainTokens';
export type {
  ChainType,
  UnifiedToken,
  UseMultiChainTokensParams,
  UseMultiChainTokensResult,
} from './useMultiChainTokens';

// Token search hook (used by TokenSelector in ui and ui-extension)
export {
  useTokenSearch,
  default as useTokenSearchDefault,
} from './useTokenSearch';
export type {
  TokenSelectorToken,
  UseTokenSearchResult,
} from './useTokenSearch';

// Address validation hook (used by InputAddress in ui and ui-extension)
export {
  useAddressValidation,
  default as useAddressValidationDefault,
} from './useAddressValidation';
export type {
  BlockchainType,
  ValidationState,
  ValidationCallbackResult,
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from './useAddressValidation';

// Open link hook (used by settings screens)
export { useOpenLink } from './useOpenLink';
