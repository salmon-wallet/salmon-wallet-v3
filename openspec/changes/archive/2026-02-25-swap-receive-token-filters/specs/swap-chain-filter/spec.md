## ADDED Requirements

### Requirement: Bridge token filtering uses blockchain feature flag
The bridge token loader in `packages/shared/src/hooks/useSwapScreenLogic.ts` SHALL use `isBlockchainEnabled()` from `packages/shared/src/config/blockchains.ts` to determine which chains are valid receive destinations. Tokens from disabled blockchains MUST NOT appear in the swap receive-token list.

#### Scenario: Ethereum disabled — SOL input
- **WHEN** `ENABLED_BLOCKCHAINS` is `['solana', 'bitcoin']` (Ethereum commented out)
- **AND** the user selects a Solana token as swap input
- **AND** the bridge API returns tokens including ETH (`network: null`), ethbase (`network: "base"`), BTC (`network: null`)
- **THEN** only BTC SHALL appear in the bridge token portion of the receive list
- **AND** ETH and ethbase SHALL be excluded because `isBlockchainEnabled('ethereum')` returns `false`

#### Scenario: Ethereum disabled — BTC input
- **WHEN** `ENABLED_BLOCKCHAINS` is `['solana', 'bitcoin']`
- **AND** the user selects BTC as swap input
- **AND** the bridge API returns tokens including SOL, ETH, ethbase
- **THEN** only SOL SHALL appear in the receive list
- **AND** ETH and ethbase SHALL be excluded

#### Scenario: All chains enabled
- **WHEN** `ENABLED_BLOCKCHAINS` is `['solana', 'bitcoin', 'ethereum']`
- **AND** the bridge API returns tokens for chains solana, bitcoin, and ethereum
- **THEN** all tokens from all three chains SHALL appear in the receive list

### Requirement: Remove hardcoded SUPPORTED_CHAINS constant
The hardcoded `SUPPORTED_CHAINS` constant in `packages/shared/src/utils/swap.ts` SHALL be removed. All references to `SUPPORTED_CHAINS` — including the re-export in `packages/shared/src/utils/index.ts` — SHALL be deleted. No new constant SHALL replace it; consumers SHALL use `isBlockchainEnabled()` instead.

#### Scenario: No references remain
- **WHEN** the change is complete
- **THEN** searching the codebase for `SUPPORTED_CHAINS` SHALL return zero results
- **AND** `packages/shared/src/utils/swap.ts` SHALL NOT export any chain-list constant
- **AND** `packages/shared/src/utils/index.ts` SHALL NOT re-export `SUPPORTED_CHAINS`

### Requirement: getChainFromNetwork maps StealthEx network strings correctly
The `getChainFromNetwork()` function in `packages/shared/src/utils/swap.ts` SHALL correctly map StealthEx lowercase network identifiers to `SwapChainType` values. This includes both the existing null-network symbol-based fallback and the network substring checks that already handle short codes (`"sol"`, `"eth"`, `"btc"`).

#### Scenario: SPL token with network "sol"
- **WHEN** `getChainFromNetwork` is called with `network: "sol"` and `symbol: "usdcsol"`
- **THEN** it SHALL return `'solana'`

#### Scenario: ERC-20 token with network "eth"
- **WHEN** `getChainFromNetwork` is called with `network: "eth"` and `symbol: "usdceth"`
- **THEN** it SHALL return `'ethereum'`

#### Scenario: Mainnet BTC with null network
- **WHEN** `getChainFromNetwork` is called with `network: null` and `symbol: "btc"`
- **THEN** it SHALL return `'bitcoin'`

#### Scenario: Unsupported network
- **WHEN** `getChainFromNetwork` is called with `network: "bsc"` and `symbol: "nearbsc"`
- **THEN** it SHALL return `null`
