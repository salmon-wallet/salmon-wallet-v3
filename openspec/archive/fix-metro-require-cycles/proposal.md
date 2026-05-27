## Why

Metro bundler reports 6 require cycle warnings on every app start. Two of these (self-cycles in `.native.ts` hooks) are latent bugs where `ADAPTER_PREFIXES` and `DEFAULT_CACHE_TTL` resolve to `undefined` at runtime due to Metro's platform resolution redirecting imports back to the importing file. The remaining four are structural cycles that work by timing coincidence but produce noisy warnings and fragile module initialization order.

## What Changes

- Extract `SOLANA_NETWORKS`, `BITCOIN_NETWORKS`, and `ETHEREUM_NETWORKS` from their respective `factory.ts` files into dedicated `networks.ts` files within each blockchain module, breaking the `Account ↔ factory` mutual dependency (cycles 1 & 2)
- Move `getBlockchainFromNetworkId` from `utils/account.ts` to `config/blockchains.ts` where it semantically belongs, making the dependency unidirectional (cycle 3)
- Extract shared constants and types from `useRuntime.ts` and `useRefreshOnFocus.ts` into `.shared.ts` files that Metro won't redirect via platform resolution (cycles 4 & 5)
- Change `PrivateKeyReveal.tsx` to import from specific component barrels (`../Button`, `../SettingsScreenLayout`) instead of the parent barrel `..` (cycle 6)
- Update all affected imports across the codebase (~20-30 files) and re-export moved symbols from their original barrel locations to maintain public API compatibility

## Capabilities

### New Capabilities

_None — this is a refactor with no new functionality._

### Modified Capabilities

_None — no spec-level behavior changes, only internal module organization._

## Impact

- **packages/shared**: `blockchain/solana/`, `blockchain/bitcoin/`, `blockchain/ethereum/` (new `networks.ts` files), `config/blockchains.ts`, `utils/account.ts`, `hooks/useRuntime.ts`, `hooks/useRuntime.native.ts`, `hooks/useRefreshOnFocus.ts`, `hooks/useRefreshOnFocus.native.ts`, `hooks/useRefreshOnFocus.web.ts`, `hooks/index.ts`, `utils/index.ts`
- **apps/mobile**: `src/components/PrivateKeyReveal/PrivateKeyReveal.tsx`
- All existing tests must continue to pass — no behavioral changes
- All barrel re-exports maintained — no breaking changes for consumers
