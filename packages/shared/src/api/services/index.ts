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
  type CoinMarketData,
  type CoinLinks,
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
  // Functions (async, makes network calls)
  getWalletBalance,
} from './balance';

// Re-export pure balance utilities from utils
export {
  // Types
  type RawTokenBalance,
  type TokenBalance,
  type TokenBalanceWithPrice,
  type WalletBalance,
  type JupiterPriceData,
  // Constants
  SOL_CONSTANTS,
  USDC_ADDRESS,
  LAMPORTS_PER_SOL,
  // Functions
  decorateBalanceList,
  decorateBalancePrices,
  calculate24HoursChange,
  createSolBalance,
} from '../../utils/balance';

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
// Bitcoin Transfer Service
// ============================================================================

export {
  fetchUtxos,
  broadcastTransaction,
} from './bitcoin-transfer';

// ============================================================================
// Bitcoin Account Service (DI adapters for BitcoinAccount)
// ============================================================================

export {
  fetchBitcoinAccountBalance,
  fetchBitcoinAccountPrices,
  fetchBitcoinAccountTransaction,
  fetchBitcoinAccountRecentTransactions,
} from './bitcoin-account';

// ============================================================================
// Solana Service
// ============================================================================

export {
  // Types - Network
  type SolanaNetworkId,
  // Types - Transaction (backend-transformed format)
  type SolanaTransactionTokenAmount,
  type SolanaTransactionFee,
  type SolanaTransactionStatusBackend,
  type SolanaTransactionTypeBackend,
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
  // Types - Swap
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

// ============================================================================
// DApp Service
// ============================================================================

export {
  // Types
  type DappMetadata,
  type GetMetadataParams,
  // Functions
  getMetadata as getDappMetadata,
} from './dapp';

// ============================================================================
// Switch Service (Feature Flags)
// ============================================================================

export {
  // Types
  type Switch,
  type SwitchesResponse,
  type SwitchMap,
  // Functions
  getSwitches,
  getSwitch,
  isSwitchEnabled,
  getSwitchMap,
  getEnabledSwitches,
  clearSwitchesCache,
} from './switch';

// ============================================================================
// Bridge Service
// ============================================================================

export {
  // Types
  type BridgeToken,
  type BridgeAvailableToken,
  type BridgeFeaturedToken,
  type BridgeEstimateResponse,
  type BridgeMinimalResponse,
  type BridgeExchange,
  type BridgeTransaction,
  type BridgeTransactionStatus,
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
} from './ethereum';

// ============================================================================
// Multi-chain Transaction Service
// ============================================================================

export {
  // Types
  type TransactionNetworkId,
  type TransactionItem,
  type TransactionPagingParams,
  type TransactionsResponse,
  // Functions - aliased to avoid conflicts with chain-specific services
  getTransactions as getMultichainTransactions,
  getTransaction as getMultichainTransaction,
  getRecentTransactions as getRecentMultichainTransactions,
  getAllTransactions as getAllMultichainTransactions,
} from './transactions';

// ============================================================================
// Ethereum NFT Service
// ============================================================================

export {
  // Types
  type EthereumNftNetworkId,
  type EthereumNftAttribute,
  type EthereumNft,
  // Functions
  getEthereumNfts,
  getEthereumNftById,
} from './ethereum-nft';

// ============================================================================
// Solana NFT Service
// ============================================================================

export {
  // Types
  type SolanaNftNetworkId,
  // Functions
  getSolanaNfts,
  getSolanaNftByAddress,
} from './solana-nft';

// ============================================================================
// Bitcoin Ordinals Service
// ============================================================================

export {
  // Types
  type BitcoinOrdinalsNetworkId,
  type OrdinalAttribute,
  type BitcoinOrdinal,
  // Functions
  getBitcoinOrdinals,
  getBitcoinOrdinalById,
} from './bitcoin-nft';
