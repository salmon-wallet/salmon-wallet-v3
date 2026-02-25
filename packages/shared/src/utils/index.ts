// URL utilities
export { normalizeIpfsUrl, DEAD_DOMAINS, getExplorerUrl, getSolscanUrl, formatOrigin } from './url';

// Account utilities
export {
  getPathIndex,
  getBlockchainFromNetworkId,
  getChainDisplayName,
  getAccountBlockchainType,
  isSolanaAccount,
  isBitcoinAccount,
  isEthereumAccount,
  generateAccountId,
  generateAccountName,
  createBlockchainAccountForNetwork,
  buildNetworkListFromAccount,
  getAccountKeysForNetwork,
  getAccountAddress,
} from './account';

// Avatar utilities
export {
  getAvatar,
  getRandomAvatar,
  getInitials,
  AVATAR_BASE_URL,
  PRESET_AVATAR_COUNT,
  PRESET_AVATAR_URLS,
  isPresetAvatar,
} from './avatar';

// Address utilities
export { getShortAddress, truncateHash } from './address';

// Clipboard utilities (web only - use expo-clipboard for native)
export { copyToClipboard, pasteFromClipboard } from './clipboard';

// Responsive scaling utilities
export {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  scale,
  s,
  verticalScale,
  vs,
  moderateScale,
  ms,
  moderateVerticalScale,
  mvs,
} from './scaling';

// Formatting utilities
export {
  // Types
  type LabelType,
  type Currency,
  // Constants
  hiddenValue,
  // Amount formatting
  formatAmount,
  showAmount,
  showValue,
  // Percentage utilities
  isPositive,
  isNegative,
  isNeutral,
  getLabelValue,
  showPercentage,
  // Currency formatting
  formatCurrency,
  // Change formatting
  showAbsoluteChange,
  // Display formatting
  formatLargeNumber,
  formatUSD,
  formatRawAmount,
  formatTokenBalance,
  formatUsdPrecise,
  formatAmountWithSymbol,
  formatPercentageCompact,
  formatPercent,
  formatSolFee,
  formatConversionRate,
  // Balance/price display formatting
  formatBalance,
  formatUsdValue,
  formatPercentChange,
  // Price impact
  type PriceImpactSeverity,
  PRICE_IMPACT_THRESHOLDS,
  getPriceImpactSeverity,
  // Price performance
  isPositivePerformance,
} from './formatting';

// Decimal & unit conversion utilities
export {
  // Constants
  SATOSHIS_PER_BTC,
  WEI_PER_ETH_BIGINT,
  // Generic conversions
  applyDecimals,
  removeDecimals,
  parseAmount,
  // ETH conversions
  ethToWei,
  weiToEth,
  weiToEthNumber,
  // BTC conversions
  btcToSatoshis,
  satoshisToBtc,
} from './decimals';

// Token utilities
export {
  // Known decimals (bridge token fallback)
  KNOWN_DECIMALS,
  // Fallback logos for native tokens
  NATIVE_TOKEN_LOGOS,
  // Token search
  filterTokensLocally,
  // CoinGecko
  KNOWN_COINGECKO_IDS,
  lookupCoingeckoId,
  hexToBalance,
  formatERC20TokenBalance,
  mergeTokenLists,
  getTokenKey,
  // ETH constants
  ETH_CONSTANTS,
  ETH_ADDRESS,
  ETH_ADDRESS_ALT,
  ERC20_ABI,
  // Native token checks
  isNativeSol,
  isNativeEth,
  // Ethereum transfer token types & factories
  type TokenType,
  type TransferToken,
  createNativeToken,
  createERC20Token,
  createERC721Token,
  createERC1155Token,
  // Feature badge colors
  DEFAULT_FEATURE_COLORS,
  getFeatureColor,
} from './tokens';

// Currency formatting utilities
export {
  getCurrencySymbol,
  getCurrencyLabel,
  formatFiatValue,
  formatFiatLarge,
  formatFiatChange,
  formatFiatPrecise,
  formatFiatIntl,
} from './currencyFormatting';

// Date utilities
export {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  formatBlockNumber,
  formatRelativeTimeCompact,
  formatDateString,
} from './date';

// Balance decoration & calculation utilities
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
  // Bigint helpers
  isZeroBalance,
  compareBalances,
} from './balance';

// Cache utilities
export { SmartCache } from './cache';
export type { SmartCacheOptions } from './cache';

// Platform detection utilities
export { isReactNative, isWebEnvironment, isExtension } from './platform';

// Network utilities
export {
  MAINNET_NETWORK_IDS,
  MAINNET_NETWORK_ID,
  sortNetworks,
  filterNetworks,
  getNetworkLabel,
} from './network';

// Validation utilities
export { VALIDATION_MESSAGES, getValidationState, getMessageType } from './validation';

// Swap utilities
export {
  isSameChain,
  getSwapType,
  getSwapMode,
  getChainFromNetwork,
  validateAddress,
  mapToSwapToken,
  unifiedToSwapToken,
} from './swap';

// Transaction transform utilities
export { transformSolanaTransaction, transformMultichainTransaction, getTransactionDescription } from './transactions';

// Content loader (platform-split: native uses react-content-loader/native, web uses SVG)
export { default as ContentLoader, ContentLoader as NamedContentLoader, Rect, Circle } from './ContentLoader';

// NFT utilities
export {
  isImageContent,
  isSvgImage,
  isAnimatedImage,
  getNftImageType,
  ethereumNftToNftData,
  bitcoinOrdinalToNftData,
  solanaNftToNftData,
  canonicalNftToSolanaNftData,
  isSolanaNft,
  isEthereumNft,
  isBitcoinNft,
  getNftBlockchainLabel,
  getSatRarityColor,
  getNftSectionTitle,
  getVisibleNftSectionKeys,
  SECTION_TO_NETWORK,
  INITIAL_NFT_SECTIONS,
} from './nft';

// NFT spam filter
export { isSpamNft, filterSpamNfts } from './nft-spam-filter';

// Price constants & helpers
export { BLOCKCHAIN_TO_COINGECKO, PERIOD_TO_DAYS, coinInfoToMarketData } from './price-constants';

// Blockchain feature-flag configuration
// NOTE: isNetworkEnabled is intentionally not re-exported here to avoid
// colliding with the async isNetworkEnabled in api/services/switch.ts.
// Import directly from '../config/blockchains' when needed.
export { ENABLED_BLOCKCHAINS, isBlockchainEnabled } from '../config/blockchains';

// Derived-accounts scanning utilities (shared between mobile and extension)
export {
  // Constants
  GAP_LIMIT,
  SCAN_NETWORKS,
  MIRROR_NETWORKS,
  NETWORK_DISPLAY,
  // Types
  type NetworkDisplayInfo,
  type DerivedAccountInfo,
  // Functions
  getAccountBalance,
  formatDerivedAccountBalance,
  getMirrorNetworkId,
  scanDerivedAccounts,
} from './derived-accounts';
export type {
  NftBlockchain,
  // NftAttribute is exported from blockchain/solana/nft
  NftDataBase,
  NftData,
  NftDataSimple,
  SolanaNftData,
  EthereumNftData,
  BitcoinNftData,
  SolanaNftFromHelius,
  NftSectionKey,
  NftSection,
  NftsBySection,
} from './nft';
