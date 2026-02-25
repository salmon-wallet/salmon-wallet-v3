## Why

Ethereum support in Salmon Wallet v3 is not yet production-ready and should not be available to end users. Rather than ripping out all Ethereum code (which is well-modularized and will be re-enabled later), we need a compile-time feature flag that prevents Ethereum accounts from ever being created. Because the UI already renders conditionally based on which blockchain accounts exist, disabling Ethereum at the account-creation layer is sufficient to hide it from the entire app.

## What Changes

- **Add an `ENABLED_BLOCKCHAINS` configuration constant** in `packages/shared` that lists which `BlockchainType` values are active. Initially: `['solana', 'bitcoin']` (Ethereum excluded).
- **Filter account creation in `account-factory.ts`** so that `createAccount` and `deriveBlockchainAccount` reject requests for disabled chains.
- **Filter derived-account scanning in `derived-accounts.ts`** so that `SCAN_NETWORKS` and `MIRROR_NETWORKS` exclude networks belonging to disabled chains.
- **No UI changes required** -- when no Ethereum accounts exist, the UI naturally hides Ethereum-related screens, balance cards, send flows, and network selectors.

## Capabilities

### New Capabilities
- `blockchain-feature-flag`: A centralized feature-flag mechanism that controls which blockchains are enabled across the wallet. Governs account creation, derived-account scanning, and network visibility.

### Modified Capabilities
- `account-add`: The account-add flow must respect the feature flag -- derived-account scanning and account creation must skip disabled blockchains.

## Impact

- **`packages/shared`** -- New config constant and filtering logic in `utils/`, `factories/`, and `utils/derived-accounts.ts`. No new dependencies.
- **`apps/mobile`** and **`apps/extension`** -- No code changes required. Both apps will automatically stop showing Ethereum because no Ethereum accounts will be created.
- **Reversibility** -- Re-enabling Ethereum is a one-line change: add `'ethereum'` back to `ENABLED_BLOCKCHAINS`.
- **Risk** -- Minimal. Existing Ethereum code stays in place, compiles, and remains importable. Only the account-creation entry points are gated.
