## ADDED Requirements

### Requirement: Centralized enabled-blockchains configuration
The system SHALL expose an `ENABLED_BLOCKCHAINS` constant of type `readonly BlockchainType[]` in `packages/shared/src/config/blockchains.ts`. This constant SHALL be the single source of truth for which blockchain families are active across the entire wallet. Initially it SHALL contain `['solana', 'bitcoin']` (Ethereum excluded).

**Package:** `packages/shared`

#### Scenario: Default configuration excludes Ethereum
- **WHEN** the wallet is built with the default configuration
- **THEN** `ENABLED_BLOCKCHAINS` contains `'solana'` and `'bitcoin'`
- **AND** `ENABLED_BLOCKCHAINS` does NOT contain `'ethereum'`

#### Scenario: Re-enabling Ethereum requires a single-line change
- **WHEN** a developer adds `'ethereum'` to the `ENABLED_BLOCKCHAINS` array
- **THEN** all Ethereum functionality is restored without any other code changes

### Requirement: Helper predicate for checking blockchain status
The system SHALL export an `isBlockchainEnabled(chain: BlockchainType): boolean` function from the same module. This function SHALL return `true` if and only if the given chain is present in `ENABLED_BLOCKCHAINS`.

**Package:** `packages/shared`

#### Scenario: Checking an enabled blockchain
- **WHEN** `isBlockchainEnabled('solana')` is called
- **THEN** it returns `true`

#### Scenario: Checking a disabled blockchain
- **WHEN** `isBlockchainEnabled('ethereum')` is called with Ethereum excluded from `ENABLED_BLOCKCHAINS`
- **THEN** it returns `false`

### Requirement: Helper predicate for checking network status
The system SHALL export an `isNetworkEnabled(networkId: string): boolean` function from the same module. This function SHALL determine the blockchain family from the network ID (using `getBlockchainFromNetworkId`) and return `true` if and only if that blockchain is in `ENABLED_BLOCKCHAINS`.

**Package:** `packages/shared`

#### Scenario: Checking a network belonging to an enabled blockchain
- **WHEN** `isNetworkEnabled('solana-mainnet')` is called
- **THEN** it returns `true`

#### Scenario: Checking a network belonging to a disabled blockchain
- **WHEN** `isNetworkEnabled('ethereum-mainnet')` is called with Ethereum disabled
- **THEN** it returns `false`

### Requirement: Account factory gates creation on enabled blockchains
The `createBlockchainAccountForNetwork` function in `packages/shared/src/utils/account.ts` SHALL check `isNetworkEnabled(networkId)` before creating an account. If the network belongs to a disabled blockchain, the function SHALL return `null` (same as an unknown network) and log a warning.

**Package:** `packages/shared`

#### Scenario: Creating an account for an enabled network succeeds
- **WHEN** `createBlockchainAccountForNetwork('solana-mainnet', mnemonic, 0)` is called
- **THEN** it returns a valid `SolanaAccount` instance

#### Scenario: Creating an account for a disabled network returns null
- **WHEN** `createBlockchainAccountForNetwork('ethereum-mainnet', mnemonic, 0)` is called with Ethereum disabled
- **THEN** it returns `null`
- **AND** a warning is logged indicating the blockchain is disabled

### Requirement: Derived-account scanning skips disabled blockchains
The `SCAN_NETWORKS` array in `packages/shared/src/utils/derived-accounts.ts` SHALL be filtered at module load time to exclude networks belonging to disabled blockchains. The `MIRROR_NETWORKS` record SHALL similarly exclude entries whose source or target network belongs to a disabled blockchain.

**Package:** `packages/shared`

#### Scenario: Scanning only includes enabled networks
- **WHEN** Ethereum is disabled
- **THEN** `SCAN_NETWORKS` contains `'solana-mainnet'`, `'bitcoin-mainnet'`, and `'bitcoin-testnet'`
- **AND** `SCAN_NETWORKS` does NOT contain `'ethereum-mainnet'`

#### Scenario: Mirror networks exclude disabled chains
- **WHEN** Ethereum is disabled
- **THEN** `MIRROR_NETWORKS` contains the `'solana-mainnet' -> 'solana-devnet'` mapping
- **AND** `MIRROR_NETWORKS` does NOT contain the `'ethereum-mainnet' -> 'ethereum-sepolia'` mapping

### Requirement: No UI changes required
The system SHALL NOT require any changes to mobile or extension UI code. All Ethereum UI surfaces (balance cards, send flows, network selectors, NFT sections) naturally disappear when no Ethereum accounts exist. The feature flag operates entirely at the shared-logic layer.

**Package:** `apps/mobile`, `apps/extension` (no changes)

#### Scenario: UI hides Ethereum when no accounts exist
- **WHEN** Ethereum is disabled via the feature flag
- **AND** no Ethereum accounts are created
- **THEN** the wallet UI does not display Ethereum balance cards, send options, or network selectors
