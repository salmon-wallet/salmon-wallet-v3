## Context

A codebase audit identified 10 utility functions duplicated across `apps/mobile/` and `apps/extension/` with no shared equivalent. Each function has 2-4 copies that are functionally identical or near-identical. Additionally, 1 function re-implements logic already available in shared.

No behavioral changes — all functions already exist, just need to be centralized in `packages/shared/src/utils/` and imported from `@salmon/shared`.

## Goals / Non-Goals

**Goals:**
- Create shared versions of all 10 duplicated utility functions
- Delete all local copies and replace with imports from `@salmon/shared`
- Fix 1 import violation (`getBlockchainFromNetwork` → `getBlockchainFromNetworkId`)
- Export all new functions via barrel `index.ts`

**Non-Goals:**
- Modifying function behavior or signatures
- Adding tests
- Touching platform-specific functions (MUI icons, RN SVG paths, etc.)
- Refactoring the consumers beyond import changes

## Decisions

### Decision 1: Function placement in shared

Each function maps to an existing shared utils file based on domain:

| Function | Destination file | Notes |
|---|---|---|
| `getAccountAddress(account)` | `utils/account.ts` | Takes `Account`, returns primary receive address (mainnet first, fallback to any) |
| `getNetworkLabel(blockchain)` | `utils/network.ts` | Maps BlockchainId to "Devnet"/"Testnet"/"Sepolia"/null |
| `getTransactionDescription(type, inputs, outputs, source?, description?)` | `utils/transactions.ts` | Human-readable tx description, uses `getShortAddress` internally |
| `mapToSwapToken(token, balance?, usdPrice?)` | `utils/swap.ts` | Converts `TokenMetadata` → `SwapToken` |
| `unifiedToSwapToken(token)` | `utils/swap.ts` | Converts `UnifiedToken` → `SwapToken` |
| `getPriceImpactSeverity(value)` | `utils/formatting.ts` | Returns 'safe'/'warning'/'high' from percentage string. Renamed from `getSeverity` for clarity |
| `isPositivePerformance(data)` | `utils/formatting.ts` | Returns true if last price >= first price in PriceDataPoint[] |
| `formatOrigin(origin)` | `utils/url.ts` | Extracts hostname from URL string with try/catch fallback |
| `getFeatureColor(feature, index)` | `utils/tokens.ts` | Returns feature badge color with cycling defaults |
| `getScalesColorForBlockchain(blockchain)` | `theme/gradients.ts` | Maps blockchain to rgba overlay color (15% opacity). Theme-adjacent |

**Rationale:** Place each function in the file that matches its domain. No new files needed — all destinations already exist.

### Decision 2: Type dependencies

Several functions require types that may need to be imported:
- `getAccountAddress`: needs `Account` type — already exported from `@salmon/shared`
- `mapToSwapToken`/`unifiedToSwapToken`: need `SwapToken`, `TokenMetadata`, `UnifiedToken` — verify these are in shared types
- `isPositivePerformance`: needs `PriceDataPoint` — already exported from `@salmon/shared`
- `getPriceImpactSeverity`: export new type `PriceImpactSeverity = 'safe' | 'warning' | 'high'` alongside the function
- `getFeatureColor`: needs `TokenFeature` — already in `packages/shared/src/types/ui/token-features.ts`
- `getScalesColorForBlockchain`: needs `BlockchainId` — already exported from `@salmon/shared`

### Decision 3: Rename `getSeverity` → `getPriceImpactSeverity`

The local name `getSeverity` is too generic. Rename to `getPriceImpactSeverity` for clarity in the shared namespace. Also export the `PriceImpactSeverity` type and the `PRICE_IMPACT_THRESHOLDS` constant.

### Decision 4: `DEFAULT_FEATURE_COLORS` becomes a shared constant

The color array `['#FF5C45', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899']` is identical in both apps. Export it as `DEFAULT_FEATURE_COLORS` from `utils/tokens.ts`.

### Decision 5: Fix `getBlockchainFromNetwork` import

In `apps/mobile/app/(app)/(tabs)/index.tsx`, the local `getBlockchainFromNetwork(network)` re-implements `getBlockchainFromNetworkId(networkId)`. Replace with `getBlockchainFromNetworkId(network.id)` from `@salmon/shared`.

### Decision 6: Remove dead code completely

After replacing imports, delete the entire local function definition. Do not leave commented-out code or TODO markers.

## Risks / Trade-offs

- **[Type compatibility]** → Low risk. All required types are already in shared. Verify `SwapToken`, `TokenMetadata`, `UnifiedToken` exports at implementation time.
- **[Behavioral drift]** → Low risk. Functions are character-identical or near-identical across apps. Take the most complete version (usually mobile, as it handles more edge cases).
- **[Import path changes]** → Each file gains new `@salmon/shared` imports. Extend existing imports where possible.
- **[`getScalesColorForBlockchain` in theme/]** → Placing in `theme/gradients.ts` rather than `utils/` because it's purely visual/theme-related. If `gradients.ts` doesn't exist, place in `theme/colors.ts` or create a new file.
