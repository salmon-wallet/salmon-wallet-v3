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
  // Types
  type TokenPrice,
  type TopToken,
  type ChartDataPoint,
  type MarketChartData,
  type CoinInfo,
  type PricePlatform,
  type NetworkId as PriceNetworkId,
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
// Token Service
// ============================================================================

export {
  // Types
  type TokenMetadata,
  type TokenListItem,
  type TokenListSource,
  type NetworkId as TokenNetworkId,
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
  // Types
  type RawTokenBalance,
  type TokenBalance,
  type TokenBalanceWithPrice,
  type WalletBalance,
  // Constants
  SOL_CONSTANTS,
  USDC_ADDRESS,
  LAMPORTS_PER_SOL,
  // Functions
  decorateBalanceList,
  decorateBalancePrices,
  calculate24HoursChange,
  createSolBalance,
  getWalletBalance,
  formatBalance,
  formatUsdValue,
  formatPercentChange,
} from './balance';

// ============================================================================
// Marketplace Service
// ============================================================================

export {
  // Types
  type NetworkId as MarketplaceNetworkId,
  type ListNftParams,
  type UnlistNftParams,
  type BuyNftParams,
  type PlaceBidParams,
  type CancelBidParams,
  type BurnNftParams,
  type TransactionResponse,
  type NftListing,
  type NftBid,
  // Functions
  createListingTransaction,
  createUnlistTransaction,
  createBuyTransaction,
  createBidTransaction,
  createCancelBidTransaction,
  createBurnTransaction,
  getUserListings,
  getUserBids,
} from './marketplace';

// ============================================================================
// Bitcoin Service
// ============================================================================

export {
  // Types
  type BitcoinNetworkId,
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
} from './bitcoin';

// ============================================================================
// Solana Service
// ============================================================================

export {
  // Types
  type SolanaNetworkId,
  type SolanaTokenTransfer,
  type SolanaNativeTransfer,
  type SolanaAccountData,
  type SolanaInstruction,
  type SolanaTransactionStatus,
  type SolanaTransactionType,
  type SolanaTransaction,
  type SolanaPagingParams,
  type SolanaTransactionsResponse,
  type SwapRouteInfo,
  type SwapOrderResponse,
  type SwapOrderParams,
  type SwapExecuteRequest,
  type ApiSwapExecuteResponse,
  // Functions - Transactions
  getSolanaTransactions,
  getSolanaTransaction,
  getAllSolanaTransactions,
  getRecentSolanaTransactions,
  getTransactionsByType,
  // Functions - Swap
  getSwapOrder,
  executeSwapApi,
} from './solana';
