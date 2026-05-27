# blockchain-feature-flag Specification

## Purpose

Define how the wallet decides which blockchain families and networks are active at runtime. The backend network catalog (`/v1/networks`) is the single source of truth for enablement. Local config in `packages/shared/src/config/blockchains.ts` only retains legacy defaults used for static typing and last-resort composition; it does NOT gate runtime behavior. All gating points consult the backend through async helpers in `packages/shared/src/api/services/network.ts`.

## Requirements

### Requirement: Backend network catalog is the runtime source of truth

The backend SHALL expose a `/v1/networks` endpoint returning a list of `NetworkCatalogEntry` objects with at least `{ id, blockchain, enabled, config }`. The wallet SHALL treat this response as the authoritative answer to "is network X active right now". The wallet SHALL NOT depend on a local static array to decide whether a network is enabled at runtime.

**Package:** `packages/shared`

#### Scenario: Backend reports network as enabled

- **WHEN** the backend returns `{ id: 'solana-mainnet', enabled: true }` for `solana-mainnet`
- **THEN** `await isBackendNetworkEnabled('solana-mainnet')` resolves to `true`

#### Scenario: Backend reports network as disabled

- **WHEN** the backend returns `{ id: 'ethereum-mainnet', enabled: false }` for `ethereum-mainnet`
- **THEN** `await isBackendNetworkEnabled('ethereum-mainnet')` resolves to `false`

#### Scenario: Backend omits a network entirely

- **WHEN** `ethereum-sepolia` is not present in the `/v1/networks` response
- **THEN** `await isBackendNetworkEnabled('ethereum-sepolia')` resolves to `false`

### Requirement: Async gate in the account factory

The `createBlockchainAccountForNetwork` function in `packages/shared/src/utils/account.ts` SHALL await `fetchAndMergeNetworkConfigs()` to populate the in-memory network maps and SHALL await `isBackendNetworkEnabled(networkId)` before creating an account. If the backend reports the network as disabled (or absent), the function SHALL return `null` and log a warning. The function MUST NOT consult the local `ENABLED_BLOCKCHAINS` array as the gate.

**Package:** `packages/shared`

#### Scenario: Creating an account for a backend-enabled network succeeds

- **WHEN** the backend reports `solana-mainnet` as enabled
- **AND** `createBlockchainAccountForNetwork('solana-mainnet', mnemonic, 0)` is called
- **THEN** it returns a valid `SolanaAccount` instance

#### Scenario: Creating an account for a backend-disabled network returns null

- **WHEN** the backend reports `ethereum-mainnet` as disabled
- **AND** `createBlockchainAccountForNetwork('ethereum-mainnet', mnemonic, 0)` is called
- **THEN** it returns `null`
- **AND** a warning is logged indicating the blockchain is disabled

### Requirement: Async helpers for derived-account scanning

The system SHALL expose async helpers in `packages/shared/src/utils/derived-accounts.ts` that filter scan and mirror network candidates by the backend catalog at call time:

- `getScanNetworks(): Promise<string[]>` SHALL return the subset of `SCAN_NETWORK_CANDIDATES` that the backend currently reports as enabled.
- `getMirrorNetworks(): Promise<Record<string, string>>` SHALL return only mirror entries whose source AND target are both backend-enabled.
- `getMirrorNetworkId(networkId: string): Promise<string | undefined>` SHALL resolve to the mirror network for the given source if both source and target are backend-enabled, otherwise `undefined`.

The legacy synchronous constants `SCAN_NETWORKS` and `MIRROR_NETWORKS` MUST NOT be exported from the public surface.

**Package:** `packages/shared`

#### Scenario: Scanning only includes backend-enabled networks

- **WHEN** the backend reports `solana-mainnet`, `bitcoin-mainnet`, `bitcoin-testnet` as enabled
- **AND** the backend does not report any Ethereum network as enabled
- **THEN** `await getScanNetworks()` resolves to a list containing the Solana and Bitcoin networks
- **AND** the resolved list does NOT contain any Ethereum network ID

#### Scenario: Mirror networks exclude pairs whose target is backend-disabled

- **WHEN** the backend reports `solana-mainnet` and `solana-devnet` as enabled
- **AND** the backend reports no Ethereum network as enabled
- **THEN** `await getMirrorNetworks()` resolves to a record containing `'solana-mainnet' -> 'solana-devnet'`
- **AND** the resolved record does NOT contain any Ethereum mirror entry

### Requirement: Local config is legacy defaults only

The `ENABLED_BLOCKCHAINS` constant and the `isBlockchainEnabled` / `isNetworkEnabled` helpers in `packages/shared/src/config/blockchains.ts` SHALL be treated as legacy local defaults. They MAY be used for static typing or last-resort composition but MUST NOT be the runtime gate. New code SHOULD prefer the async backend helpers.

**Package:** `packages/shared`

#### Scenario: Legacy helpers do not gate runtime account creation

- **WHEN** `ENABLED_BLOCKCHAINS` is mutated locally to exclude a blockchain
- **AND** the backend continues to report that blockchain's network as enabled
- **THEN** `createBlockchainAccountForNetwork` still creates an account for that network

### Requirement: UI surfaces follow backend enablement transparently

The system SHALL NOT require platform-specific UI code changes to add or remove a blockchain. UI surfaces (balance cards, send flows, network selectors, NFT sections) SHALL be driven by the accounts that exist for the user, which in turn follow the backend network catalog through the async gate above.

**Package:** `apps/mobile`, `apps/extension`, `apps/web`

#### Scenario: UI hides a blockchain when the backend disables all of its networks

- **WHEN** the backend reports every Ethereum network as disabled
- **AND** the user has no pre-existing Ethereum accounts
- **THEN** no Ethereum balance cards, send options, or network selectors render in the wallet UI
