## Context

Metro bundler emits 6 require cycle warnings on every mobile app start. The cycles fall into three categories:

1. **Cross-file mutual imports** (cycles 1-3): `SolanaAccount ↔ factory`, the long chain via barrel `solana/index.ts`, and `account.ts ↔ blockchains.ts`. These work today because the imported symbols are either used lazily (inside methods, not at module top-level) or are hoisted function declarations.

2. **Platform-resolution self-cycles** (cycles 4-5): `useRuntime.native.ts` and `useRefreshOnFocus.native.ts` import from `./useRuntime` and `./useRefreshOnFocus` respectively. Metro resolves these back to the `.native.ts` file itself. Constants like `ADAPTER_PREFIXES` and `DEFAULT_CACHE_TTL` are `undefined` at runtime — latent bugs.

3. **Barrel re-import** (cycle 6): `PrivateKeyReveal.tsx` imports from `..` (the parent `components/index.ts` barrel), which re-exports `PrivateKeyReveal` itself.

The `*_NETWORKS` constants (`SOLANA_NETWORKS`, `BITCOIN_NETWORKS`, `ETHEREUM_NETWORKS`) follow a consistent pattern across all three blockchain modules — they all live in their respective `factory.ts` files. Any refactor must maintain this cross-chain consistency.

## Goals / Non-Goals

**Goals:**
- Eliminate all 6 Metro require cycle warnings
- Fix the latent `undefined` bugs in `useRuntime.native.ts` and `useRefreshOnFocus.native.ts`
- Maintain all existing public API exports (no breaking changes for consumers)
- All existing tests must pass without modification

**Non-Goals:**
- Refactoring blockchain architecture beyond what's needed to break cycles
- Changing any runtime behavior or adding features
- Modifying test files (tests validate existing behavior is preserved)

## Decisions

### Decision 1: Extract `*_NETWORKS` to `networks.ts` per blockchain module

**What:** Create `networks.ts` in each of `blockchain/solana/`, `blockchain/bitcoin/`, `blockchain/ethereum/` containing only the `*_NETWORKS` constant and its type import. Re-export from `factory.ts` and `index.ts` barrels for backward compatibility.

**Why over alternatives:**
- *Why not leave in `factory.ts`?* — `factory.ts` imports the `*Account` class to instantiate it, and `*Account` imports `*_NETWORKS` from `factory.ts` for dynamic config lookup. Circular.
- *Why not move to `types/`?* — These are runtime data (Record objects), not types.
- *Why `networks.ts` in each blockchain dir?* — Follows the existing per-chain module structure. Each chain already has `factory.ts`, `transfer.ts`, `index.ts`, etc. Adding `networks.ts` as a peer is consistent.

**Consumers update strategy:** Files that import `*_NETWORKS` from the barrel (`../blockchain/solana`) need no changes — the barrel re-exports it. Files that import directly from `./factory` (like `useAvailableNetworks.ts`) should be updated to import from `./networks` but will still work via `./factory` re-export if missed.

### Decision 2: Move `getBlockchainFromNetworkId` to `config/blockchains.ts`

**What:** Move the function from `utils/account.ts` to `config/blockchains.ts`. Re-export from `utils/account.ts` and `utils/index.ts` for backward compatibility.

**Why:** `getBlockchainFromNetworkId` is a pure function (3 lines of `startsWith`) with zero dependencies. It determines which blockchain family a network ID belongs to — this is blockchain configuration logic, not account logic. `config/blockchains.ts` already uses this function and is the module that defines `ENABLED_BLOCKCHAINS` and `isBlockchainEnabled`. Moving it there makes the dependency unidirectional: `utils/account.ts → config/blockchains.ts`.

**Why not inline in `blockchains.ts`?** — 6+ consumers import `getBlockchainFromNetworkId`. Duplicating logic would be worse than moving it.

### Decision 3: Extract shared hook constants to `*.shared.ts` files

**What:** Create `useRuntime.shared.ts` and `useRefreshOnFocus.shared.ts` containing only the types and constants that platform-specific files need. Update `.native.ts`, `.web.ts`, and base `.ts` files to import from `.shared.ts`.

**Why `.shared.ts`?** Metro's platform resolution only applies to `.native.ts`, `.ios.ts`, `.android.ts`, and `.web.ts` suffixes. The `.shared.ts` suffix is not a platform extension, so `import from './useRuntime.shared'` always resolves to `useRuntime.shared.ts` regardless of platform. This is the standard React Native pattern for breaking platform-split self-cycles.

**What moves:**
- `useRuntime.shared.ts`: `RuntimeInfo` type + `ADAPTER_PREFIXES` constant
- `useRefreshOnFocus.shared.ts`: `UseRefreshOnFocusOptions` type + `DEFAULT_CACHE_TTL` constant

The base `.ts` files keep their hook implementations and re-export the types/constants for barrel compatibility.

### Decision 4: Direct imports in `PrivateKeyReveal.tsx`

**What:** Replace `import { PrimaryButton, SecondaryButton, SettingsScreenLayout } from '..'` with direct imports from each component's own barrel: `../Button` and `../SettingsScreenLayout`.

**Why:** The parent `components/index.ts` barrel re-exports `PrivateKeyReveal` alongside `PrimaryButton` etc. Importing from `..` creates a cycle. Importing from sibling directories directly avoids the barrel entirely. The component barrels already exist.

## Risks / Trade-offs

- **[Risk] Missed import update** → Mitigated by re-exporting moved symbols from original locations. Any missed direct-import update still works via the re-export. Typecheck catches any truly broken import.
- **[Risk] Test files use direct `process.env` assignment** → No risk. Tests run in Node.js (Vitest) where `process.env` is a real object. The module-level organization changes don't affect test behavior.
- **[Trade-off] Three new `networks.ts` files** → Small file count increase in exchange for clean dependency graph across all blockchain modules. Each file is ~20-40 lines.
- **[Trade-off] Two new `.shared.ts` files** → Adds files but follows established RN ecosystem pattern. Alternative (putting constants in a non-hook utility file) would scatter related code.
