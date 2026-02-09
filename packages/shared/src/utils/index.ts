// URL utilities
export { normalizeIpfsUrl, DEAD_DOMAINS } from './url';

// Account utilities
export { getPathIndex } from './account';

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

// Token utilities
export {
  KNOWN_COINGECKO_IDS,
  lookupCoingeckoId,
  hexToBalance,
  formatERC20TokenBalance,
  mergeTokenLists,
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
} from './balance';

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
