// URL utilities
export { normalizeIpfsUrl, DEAD_DOMAINS, getExplorerUrl, getSolscanUrl } from './url';

// Account utilities
export {
  getPathIndex,
  getBlockchainFromNetworkId,
  getAccountBlockchainType,
  isSolanaAccount,
  isBitcoinAccount,
  isEthereumAccount,
  generateAccountId,
  generateAccountName,
  createBlockchainAccountForNetwork,
} from './account';

// Avatar utilities
export { getAvatar, getRandomAvatar } from './avatar';

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
  formatSolFee,
  formatConversionRate,
  // Balance/price display formatting
  formatBalance,
  formatUsdValue,
  formatPercentChange,
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
  // BTC conversions
  btcToSatoshis,
  satoshisToBtc,
} from './decimals';

// Token utilities
export {
  // Token search
  filterTokensLocally,
  // CoinGecko
  KNOWN_COINGECKO_IDS,
  lookupCoingeckoId,
  hexToBalance,
  formatERC20TokenBalance,
  mergeTokenLists,
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
} from './tokens';

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
} from './network';

// Validation utilities
export { VALIDATION_MESSAGES, getValidationState, getMessageType } from './validation';

// Swap utilities
export { isSameChain, getSwapType } from './swap';

// Transaction transform utilities
export { transformSolanaTransaction, transformMultichainTransaction } from './transactions';

// NFT utilities
export {
  isImageContent,
  ethereumNftToNftData,
  bitcoinOrdinalToNftData,
  solanaNftToNftData,
  isSolanaNft,
  isEthereumNft,
  isBitcoinNft,
  getNftBlockchainLabel,
  getSatRarityColor,
} from './nft';
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
} from './nft';
