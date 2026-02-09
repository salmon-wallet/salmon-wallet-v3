// Solana Account
export { SolanaAccount } from './SolanaAccount';
export type {
  SolanaNetwork,
  SolanaNetworkConfig,
  SolanaAccountOptions,
  SolanaBalance,
} from './SolanaAccount';

// Factory functions and utilities
export {
  createSolanaAccount,
  createSolanaAccountFromKeyPair,
  createSolanaAccountFromSecretKey,
  deriveSolanaAccounts,
  generateKeyPair,
  getSolanaDerivationPath,
  SOLANA_COIN_TYPE,
  SOLANA_NETWORKS,
} from './factory';
export type {
  CreateSolanaAccountOptions,
  DeriveAccountsOptions,
} from './factory';

// Transfer functions
export {
  createTransfer,
  createSolTransaction,
  createSplTransaction,
  estimateFee,
  calculateTransferFee,
  requiresMemo,
  confirmTransaction,
  airdrop,
  applyDecimals,
  removeDecimals,
  isNativeSol,
  SOL_ADDRESS,
} from './transfer';
export type {
  TransferOptions,
  TransferResult,
  EstimateFeeOptions,
  TransferFeeInfo,
} from './transfer';

// NFT functions
export {
  getAll as getAllNfts,
  getAllPaginated as getAllNftsPaginated,
  getAllFromHeliusDirect,
  getAllGroupedByCollection,
  getNftByAddress,
  getCollections,
  getNftsByCollection,
  getNftsWithoutCollection,
  isCollection,
  isMoreThanOne,
  isBlacklisted,
} from './nft';
export type {
  Nft,
  NftMint,
  NftCollection,
  NftEdition,
  NftCreator,
  NftAttribute,
  NftExtras,
  Token2022Extension,
  NftPagination,
  NftPaginatedResponse,
  NftCollectionGroup,
  GetNftsOptions,
  FetchNftsFromBackendFn,
  FetchNftByAddressFn,
} from './nft';

// Domain name services
export {
  getSolDomain,
  resolveSolDomain,
  getAllDomain,
  resolveAllDomain,
  getDomain,
  getDomainFromPublicKey,
  getPublicKeyFromDomain,
} from './domains';

// Swap functions
export {
  getSwapQuote,
  executeSwap,
  swap,
  getExpectedOutput,
  getMinimumOutput,
  getPriceImpact,
} from './swap';
export type {
  SwapNetworkId,
  SwapQuoteParams,
  SwapQuote,
  SwapResult,
  GetSwapQuoteOptions,
  GetSwapOrderFn,
  ExecuteSwapApiFn,
  GetTokenListFn,
} from './swap';

// Transaction history functions
export {
  getRecentTransactions,
  isTransferTransaction,
  isSwapTransaction,
  isNftTransaction,
  isSuccessful,
  isFailed,
  getNetTokenAmount,
  getInvolvedTokens,
  getTransactionDate,
  getTimeAgo,
  isStakingTransaction,
  isTokenMintOrBurn,
  getExplorerUrl,
  getSolscanUrl,
} from './transactions';
export type {
  // Solana transaction types
  SolanaTransactionPaging,
  SolanaTransactionListResponse,
  GetSolanaTransactionsFn,
  // Re-exported from API service (backend-transformed format)
  SolanaTransaction,
  SolanaTransactionsResponse,
  SolanaPagingParams,
  SolanaTransactionTokenAmount,
  SolanaTransactionFee,
  SolanaTransactionTypeBackend,
  SolanaTransactionStatusBackend,
} from './transactions';

// Validation functions
export { validateDestinationAccount } from './validation';
export type {
  ValidationResult,
  ValidationResultType,
  ValidationResultCode,
  AddressType,
} from './validation';
