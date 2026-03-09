## ADDED Requirements

### Requirement: No require cycles in Metro bundle

The `packages/shared` module graph SHALL contain no circular import paths detectable by Metro bundler. Platform-specific files (`.native.ts`, `.web.ts`) SHALL import shared constants and types from `.shared.ts` files, not from the base module name that Metro redirects.

#### Scenario: Metro bundler starts with zero cycle warnings
- **WHEN** the mobile app is started with `pnpm mobile:ios` or `pnpm mobile:android`
- **THEN** Metro SHALL produce zero "Require cycle" warnings in the console output

#### Scenario: Blockchain network constants are importable without cycles
- **WHEN** any module imports `SOLANA_NETWORKS`, `BITCOIN_NETWORKS`, or `ETHEREUM_NETWORKS` from their blockchain barrel (`../blockchain/solana`, etc.)
- **THEN** the import SHALL resolve without creating a circular dependency between the `*Account` class and the networks constant

#### Scenario: Platform hook constants are defined at runtime
- **WHEN** `useRuntime.native.ts` accesses `ADAPTER_PREFIXES` at runtime
- **THEN** the value SHALL be the array `['solana-wallet:', 'https://salmonwallet.io/adapter']`, not `undefined`

#### Scenario: Platform hook cache TTL is defined at runtime
- **WHEN** `useRefreshOnFocus.native.ts` accesses `DEFAULT_CACHE_TTL` at runtime
- **THEN** the value SHALL be `60000` (60 seconds), not `undefined`

### Requirement: Public API backward compatibility

All existing barrel exports from `packages/shared` SHALL remain available at their current import paths. Moved symbols SHALL be re-exported from their original locations.

#### Scenario: Existing imports continue to work
- **WHEN** a consumer imports `getBlockchainFromNetworkId` from `@salmon/shared` (via `utils/index.ts`)
- **THEN** the import SHALL resolve successfully to the function now defined in `config/blockchains.ts`

#### Scenario: Direct factory imports continue to work
- **WHEN** a consumer imports `SOLANA_NETWORKS` from `blockchain/solana/factory`
- **THEN** the import SHALL resolve successfully via re-export from the new `networks.ts`
