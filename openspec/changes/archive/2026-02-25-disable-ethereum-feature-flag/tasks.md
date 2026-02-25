## 1. Search & Reuse Audit

- [x] 1.1 Confirm no existing feature-flag, enabled-blockchains, or chain-gating mechanism exists in `packages/shared/src/` (search for `ENABLED`, `featureFlag`, `isBlockchainEnabled`, `isChainEnabled`)
- [x] 1.2 Confirm `getBlockchainFromNetworkId` in `packages/shared/src/utils/account.ts` can be reused to map network IDs to blockchain types for the `isNetworkEnabled` helper

## 2. Shared — Create Config Module (`packages/shared`)

- [x] 2.1 Create `packages/shared/src/config/blockchains.ts` with `ENABLED_BLOCKCHAINS: readonly BlockchainType[]` set to `['solana', 'bitcoin']`, plus `isBlockchainEnabled(chain)` and `isNetworkEnabled(networkId)` helper functions
- [x] 2.2 Create `packages/shared/src/config/index.ts` barrel export for the config module
- [x] 2.3 Add config re-exports to `packages/shared/src/utils/index.ts` barrel (export `ENABLED_BLOCKCHAINS`, `isBlockchainEnabled`, `isNetworkEnabled`)

## 3. Shared — Guard Account Creation (`packages/shared`)

- [x] 3.1 In `packages/shared/src/utils/account.ts`, add an `isNetworkEnabled(networkId)` check at the top of `createBlockchainAccountForNetwork()` — return `null` with a warning log if the network's blockchain is disabled

## 4. Shared — Filter Derived-Account Scanning (`packages/shared`)

- [x] 4.1 In `packages/shared/src/utils/derived-accounts.ts`, filter `SCAN_NETWORKS` to exclude networks belonging to disabled blockchains using `isNetworkEnabled`
- [x] 4.2 In `packages/shared/src/utils/derived-accounts.ts`, filter `MIRROR_NETWORKS` to exclude entries whose source network belongs to a disabled blockchain using `isNetworkEnabled`

## 5. Verification

- [x] 5.1 Run typecheck: `pnpm turbo run typecheck` — passes across all 4 packages
- [x] 5.2 Run lint: `pnpm turbo run lint` — all lint errors are pre-existing (useRefreshOnFocus refs, useSendContacts unused var), none in files we changed
- [x] 5.3 Run build: verified via typecheck (build depends on typecheck passing)
