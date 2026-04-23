/**
 * API Services
 *
 * Core adapter services for connecting to the Salmon backend API.
 * Migrated from salmon-wallet-v2/src/adapter/services/
 *
 * Services:
 * - Price Service: Token prices, charts, coin info
 * - Token Service: Token lists, metadata, search
 * - Balance Service: Wallet balances, portfolio calculations
 *
 * All services implement multi-tier fallback patterns:
 * 1. Salmon Backend API (primary, fastest)
 * 2. Jupiter Aggregator (fallback for tokens)
 * 3. CDN sources (last resort)
 */

// ============================================================================
// Price Service
// ============================================================================

export {
  // Functions
  getPricesByPlatform,
  getPricesByIds,
  getTopTokensByPlatform,
  getSolanaTokenPrice,
  getMarketChart,
  getCoinInfo,
  findTokenPrice,
  clearPriceCache,
  getPriceCacheStatus,
} from './price';

// ============================================================================
// Exchange Rates Service
// ============================================================================

export {
  getExchangeRates,
  clearExchangeRateCache,
} from './exchangeRates';

// ============================================================================
// Token Service
// ============================================================================

export {
  // Functions
  getTokenList,
  getFeaturedTokenList,
  getTokenMetadataByMints,
  getVerifiedTokens,
  searchTokens,
  getTokenByAddress,
  clearTokenListCache,
  getTokenListSource,
} from './tokens';

// ============================================================================
// Balance Service
// ============================================================================

export {
  // Functions (async, makes network calls)
  getWalletBalance,
} from './balance';

// ============================================================================
// Marketplace Service
// ============================================================================

export {
  // Functions
  createListingTransaction,
  createUnlistTransaction,
  createBuyTransaction,
  createBidTransaction,
  createCancelBidTransaction,
  createBurnTransaction,
  getUserListings,
  getUserBids,
  getCollectionGroupByFilter,
  getCollectionById,
  getCollectionItemsById,
  getListedByOwner,
  getBidsByOwner,
} from './marketplace';

// ============================================================================
// Bitcoin Service
// ============================================================================

export {
  // Types
  type BitcoinBalance,
  type BitcoinUtxo,
  type BitcoinTransactionInput,
  type BitcoinTransactionOutput,
  type BitcoinTransaction,
  type BitcoinPagingParams,
  type BitcoinTransactionsResponse,
  type BroadcastTransactionRequest,
  type BroadcastTransactionResponse,
  // Functions
  getBitcoinBalance,
  getBitcoinUtxos,
  getBitcoinTransactions,
  getBitcoinTransaction,
  broadcastBitcoinTransaction,
  // DI adapters (transfer)
  fetchUtxos,
  broadcastTransaction,
  // DI adapters (account)
  fetchBitcoinAccountBalance,
  fetchBitcoinAccountPrices,
  fetchBitcoinAccountTransaction,
  fetchBitcoinAccountRecentTransactions,
  bitcoinApiFunctions,
} from './bitcoin';

// ============================================================================
// Solana Service
// ============================================================================

export {
  // Types - Transaction (backend-transformed format)
  // Note: SolanaTransaction uses TransactionTokenAmount, TransactionFee,
  // TransactionDisplayStatus, TransactionType from types/transaction.ts
  type SolanaTransaction,
  // Types - Transaction (legacy/raw format for blockchain module)
  type SolanaTokenTransfer,
  type SolanaNativeTransfer,
  type SolanaAccountData,
  type SolanaInstruction,
  type SolanaTransactionStatus,
  type SolanaTransactionType,
  // Types - Pagination
  type SolanaPagingParams,
  type SolanaTransactionsResponse,
  // Note: Swap types (SwapOrderParams, SwapExecuteRequest, ApiSwapExecuteResponse)
  // are in types/swap.ts - import from @salmon/shared
  // Functions - Transactions
  getSolanaTransactions,
  getSolanaTransaction,
  getAllSolanaTransactions,
  getRecentSolanaTransactions,
  getTransactionsByType,
  // Functions - Swap
  getSwapOrder,
  executeSwapApi,
  // DI adapter
  solanaApiFunctions,
} from './solana';

// ============================================================================
// DApp Service
// ============================================================================

export {
  // Functions
  getMetadata as getDappMetadata,
} from './dapp';

// ============================================================================
// Switch Service (Feature Flags)
// ============================================================================

export {
  // Functions
  getSwitches,
  getSwitch,
  isNetworkEnabled,
  getSwitchMap,
  getEnabledNetworks,
  clearSwitchesCache,
} from './switch';

// ============================================================================
// Bridge Service
// ============================================================================

export {
  // Functions
  getBridgeSupportedTokens,
  getBridgeAvailableTokens,
  getBridgeFeaturedTokens,
  getBridgeEstimatedAmount,
  getBridgeMinimalAmount,
  createBridgeExchange,
  getBridgeTransaction,
} from './bridge';

// ============================================================================
// Ethereum Service (ERC-20 Token Detection)
// ============================================================================

export {
  // Types
  type AlchemyTokenBalance,
  type AlchemyTokenMetadata,
  type DetectedERC20Token,
  // Functions
  getERC20TokenBalances,
  getTokenMetadataBatch,
  // DI adapter (account)
  ethereumApiFunctions,
} from './ethereum';

// ============================================================================
// Multi-chain Transaction Service
// ============================================================================

export {
  // Types
  type TransactionItem,
  type TransactionPagingParams,
  type TransactionsResponse,
  // Functions - aliased to avoid conflicts with chain-specific services
  getTransactions as getMultichainTransactions,
} from './transactions';

// ============================================================================
// Solana NFT Service
// ============================================================================

export {
  // Functions
  getSolanaNfts,
  getSolanaNftByAddress,
} from './solana-nft';

// ============================================================================
// Network Service
// ============================================================================

export {
  // Functions
  getNetworks,
  getNetwork,
  clearNetworksCache,
} from './network';
