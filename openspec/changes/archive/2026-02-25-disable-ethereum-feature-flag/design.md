## Context

Salmon Wallet v3 supports three blockchains: Solana, Bitcoin, and Ethereum. Ethereum support is not yet production-ready and should be hidden from end users. The Ethereum code is well-modularized under `packages/shared/src/blockchain/ethereum/` and should remain in the codebase for future re-enablement.

The wallet UI already renders conditionally based on which blockchain accounts exist for a given wallet. If no Ethereum accounts are ever created, Ethereum surfaces (balance cards, send flows, network selectors, NFT sections) naturally do not render. This means the feature flag only needs to operate at the account-creation and scanning layers in `packages/shared`.

Key files involved:
- `packages/shared/src/utils/account.ts` -- `createBlockchainAccountForNetwork()` routes to chain-specific factories
- `packages/shared/src/factories/account-factory.ts` -- `createAccount()` and `deriveBlockchainAccount()` call through to the above
- `packages/shared/src/utils/derived-accounts.ts` -- `SCAN_NETWORKS`, `MIRROR_NETWORKS`, and `scanDerivedAccounts()`
- `packages/shared/src/utils/network.ts` -- `MAINNET_NETWORK_IDS`, `filterNetworks()`
- `packages/shared/src/hooks/useAvailableNetworks.ts` -- provides network lists to UI

No existing feature-flag or enabled-blockchains mechanism was found in the codebase (searched for `ENABLED`, `feature_flag`, `isBlockchainEnabled`, `isChainEnabled`, `chainConfig`).

## Goals / Non-Goals

**Goals:**
- Prevent Ethereum accounts from being created anywhere in the wallet
- Prevent Ethereum networks from appearing in derived-account scans
- Make re-enabling Ethereum a single-line configuration change
- Keep all Ethereum code intact and compilable
- Zero changes to mobile or extension app code

**Non-Goals:**
- Runtime feature flags (this is compile-time / module-load-time)
- Removing Ethereum code from the codebase
- UI changes or conditional rendering logic
- Filtering Ethereum from the `useAvailableNetworks` hook (unnecessary -- no accounts means no Ethereum UI)
- Backend or API changes

## Decisions

### Decision 1: New config file at `packages/shared/src/config/blockchains.ts`

Create a dedicated config module rather than placing the constant in an existing utils file.

**Rationale:** A `config/` directory signals "project-wide configuration" and is distinct from utilities. The constant `ENABLED_BLOCKCHAINS` is a policy decision, not a utility function. This also avoids circular dependency risks since `config/` will be a leaf module imported by `utils/` and `factories/`.

**Alternatives considered:**
- Adding to `utils/network.ts` -- rejected because `network.ts` is about network manipulation, not policy configuration. Mixing policy with utilities makes it harder to find and audit.
- Adding to `types/blockchain.ts` -- rejected because types files should not contain runtime values.
- Environment variable -- rejected because this is a compile-time decision for now. Env vars add complexity (build config, runtime parsing) without benefit when the flag changes infrequently.

### Decision 2: Guard at `createBlockchainAccountForNetwork()` in `utils/account.ts`

Add the `isNetworkEnabled()` check at the top of `createBlockchainAccountForNetwork()` rather than in `account-factory.ts`.

**Rationale:** `createBlockchainAccountForNetwork()` is the single routing function that ALL account creation flows pass through -- both `createAccount()` and `deriveBlockchainAccount()` in the factory call it. Guarding here means one check covers every path. The function already returns `null` for unknown networks, so returning `null` for disabled networks follows the same pattern.

**Alternatives considered:**
- Guarding in `account-factory.ts` at `createAccount()` and `deriveBlockchainAccount()` -- rejected because this requires two guard points instead of one, and any future callers of `createBlockchainAccountForNetwork()` would bypass the check.
- Guarding in each chain-specific factory (`createSolanaAccount`, `createBitcoinAccount`, `createEthereumAccount`) -- rejected because it scatters the logic and requires touching three files.

### Decision 3: Filter `SCAN_NETWORKS` and `MIRROR_NETWORKS` at module load time

Replace the hardcoded arrays with filtered versions using `isNetworkEnabled()`.

**Rationale:** These constants are consumed once at scan time. Filtering at module load is simple, has zero runtime overhead per scan, and keeps the scanning logic itself unchanged. The constants remain `readonly` after initialization.

**Alternatives considered:**
- Filtering inside `scanDerivedAccounts()` at call time -- rejected because `SCAN_NETWORKS` is also exported and consumed directly by UI code that builds the network list for the scan sheet. Filtering at the source ensures consistency.

### Decision 4: Export from `packages/shared/src/utils/index.ts` barrel

Export `ENABLED_BLOCKCHAINS`, `isBlockchainEnabled`, and `isNetworkEnabled` from the utils barrel so consuming code uses `@salmon/shared` imports.

**Rationale:** Follows the project convention. The config module is a leaf dependency of utils, so the barrel can re-export it without circular imports.

## Risks / Trade-offs

**[Risk] Existing Ethereum accounts in storage** -- If a user previously created Ethereum accounts and the flag is then disabled, those accounts remain in storage but the factory will not create new ones. The UI will still show existing Ethereum accounts.
  - Mitigation: This is acceptable for now. A future migration task can clean up stale accounts if needed. The flag prevents *new* account creation, not retroactive deletion.

**[Risk] SCAN_NETWORKS filtering at module load is not dynamically reconfigurable** -- Changing `ENABLED_BLOCKCHAINS` requires a code change and rebuild.
  - Mitigation: This is intentional (see Non-Goals). Dynamic runtime flags are unnecessary for this use case.

**[Trade-off] `useAvailableNetworks` still returns Ethereum networks** -- The hook still includes Ethereum in `NetworksByBlockchain`. However, since no Ethereum accounts exist, the UI never renders Ethereum network options in practice.
  - Mitigation: Acceptable. Adding a filter in the hook would be defensive but unnecessary. If needed later, it is a one-line filter using `isBlockchainEnabled`.
