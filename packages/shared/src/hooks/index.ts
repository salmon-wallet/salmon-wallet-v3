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
