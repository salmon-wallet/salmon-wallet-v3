// Ethereum Account
export { EthereumAccount, WEI_PER_ETH } from './EthereumAccount';
export type {
  EthereumNetwork,
  EthereumNetworkConfig,
  EthereumAccountOptions,
  EthereumBalance,
  EthereumEnvironment,
  EthereumAddressValidationResult,
} from './EthereumAccount';

// Factory functions and utilities
export {
  createEthereumAccount,
  createEthereumAccountFromWallet,
  createEthereumAccountFromPrivateKey,
  deriveEthereumAccounts,
  getEthereumDerivationPath,
  ETHEREUM_COIN_TYPE,
  ETHEREUM_NETWORKS,
} from './factory';
export type {
  CreateEthereumAccountOptions,
  DeriveEthereumAccountsOptions,
} from './factory';

// Balance functions
export {
  getEthBalance,
  getEthereumTokenBalance,
  getEthereumTokenBalances,
  getBalance,
  formatBalanceDisplay,
  ethToWei,
  weiToEth,
  isZeroBalance,
  compareBalances,
  ETH_CONSTANTS,
  ERC20_ABI,
  WEI_PER_ETH_BIGINT,
} from './balance';
export type {
  EthereumTokenBalance as BalanceEthereumTokenBalance,
  EthereumWalletBalance,
  TokenInfo as BalanceTokenInfo,
  EthereumTokenBalanceResult,
} from './balance';

// Token functions
export {
  getTokenInfo,
  getTokensByOwner,
  getFeaturedTokens,
  getFeaturedTokenBySymbol,
  getFeaturedTokenByAddress,
  isErc20Token,
  formatTokenBalance,
  ETHEREUM_NETWORK_IDS,
} from './tokens';
export type {
  EthereumToken,
  EthereumTokenBalance,
  EthereumNetworkId,
} from './tokens';

// Transfer functions
export {
  estimateTransferFee as estimateEthereumTransferFee,
  createTransferTransaction as createEthereumTransferTransaction,
  sendTransaction as sendEthereumTransaction,
  confirmTransaction as confirmEthereumTransaction,
  isNativeEth,
  parseAmount as parseEthereumAmount,
  formatAmount as formatEthereumAmount,
  createNativeToken as createEthereumNativeToken,
  createERC20Token,
  createERC721Token,
  createERC1155Token,
  ETH_ADDRESS,
  ETH_ADDRESS_ALT,
} from './transfer';
export type {
  TokenType as EthereumTokenType,
  TransferToken as EthereumTransferToken,
  TransferOptions as EthereumTransferOptions,
  TransferResult as EthereumTransferResult,
  GasEstimate as EthereumGasEstimate,
} from './transfer';
