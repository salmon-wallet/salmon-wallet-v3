/**
 * Hooks module for shared React hooks.
 *
 * Domain types (BlockchainType, Account, TokenInfo, etc.) are now exported
 * from '../types' rather than from individual hooks. Only hook-specific
 * contract types (Use* prefixed) are re-exported here.
 *
 * @module hooks
 */

// Account management hook
export {
  useAccounts,
  default as useAccountsDefault,
} from './useAccounts';

export type {
  UseAccountsState,
  UseAccountsActions,
} from './useAccounts';

// User configuration hook
export {
  useUserConfig,
  default as useUserConfigDefault,
} from './useUserConfig';

export type {
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
export type { RuntimeInfo } from './useRuntime';
export { ADAPTER_PREFIXES } from './useRuntime';

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
  UseAvailableNetworksResult,
} from './useAvailableNetworks';

// Balance hook
export {
  useBalance,
  default as useBalanceDefault,
} from './useBalance';
export type {
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
  UseSendTransactionParams,
  UseSendTransactionResult,
} from './useSendTransaction';

// Swap hook
export {
  useSwap,
  default as useSwapDefault,
} from './useSwap';
export type {
  UseSwapParams,
  UseSwapResult,
} from './useSwap';

// Bridge hook
export {
  useBridge,
  default as useBridgeDefault,
} from './useBridge';
export type {
  UseBridgeParams,
  UseBridgeResult,
} from './useBridge';

// Multi-chain tokens hook (for unified swap/bridge)
export {
  useMultiChainTokens,
  default as useMultiChainTokensDefault,
  getChainFromNetworkId,
} from './useMultiChainTokens';
export type {
  ChainType,
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
  UseAddressValidationReturn,
  UseAddressValidationOptions,
} from './useAddressValidation';

// Open link hook (used by settings screens)
export { useOpenLink } from './useOpenLink';

// SwapScreen logic hook (shared between mobile & extension)
export { useSwapScreenLogic } from './useSwapScreenLogic';
export type {
  UseSwapScreenLogicOptions,
  UseSwapScreenLogicReturn,
} from './useSwapScreenLogic';
