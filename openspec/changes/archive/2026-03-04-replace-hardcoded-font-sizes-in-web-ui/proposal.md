## Why

`packages/ui` has 273 hardcoded `fontSize` values across 44 files. This breaks the design token contract established in `@salmon/shared` and creates visual inconsistency between web and mobile platforms. Replacing them with token references ensures a single source of truth and makes future design changes propagate automatically.

## What Changes

- **Add 5 new fontSize tokens** to `packages/shared/src/theme/typography.ts` for values that have no existing match:
  - `fontSize.caption` = 13 (23 uses — labels, secondary text)
  - `fontSize.body` = 15 (12 uses — body text, detail rows)
  - `fontSize.title` = 22 (3 uses — confirmation amounts, success titles)
  - `fontSize.iconMd` = 28 (2 uses — medium icons in account add)
  - `fontSize.iconLg` = 40 (2 uses — large icons in backup/private key panels)
- **Replace 174 hardcoded values** that already map directly to existing tokens (`10→xs`, `12→sm`, `14→base`, `16→md`, `18→lg`, `20→xl`, `24→2xl`, `36→4xl`, `48→5xl`)
- **Replace 99 hardcoded values** using the new tokens above, mapping:
  - `11` → `fontSize.xs` (10) — acceptable visual rounding, 12 uses
  - `13` → `fontSize.caption` (new, 13) — 23 uses
  - `15` → `fontSize.body` (new, 15) — 12 uses
  - `22` → `fontSize.title` (new, 22) — 3 uses
  - `25` → `fontSize['2xl']` (24) — 1 use, acceptable rounding
  - `28` → `fontSize.iconMd` (new, 28) — 2 uses
  - `32` → `fontSize['3xl']` (30) — 1 use, acceptable rounding
  - `40` → `fontSize.iconLg` (new, 40) — 2 uses

## Capabilities

### New Capabilities
- `web-font-size-tokens`: All fontSize values in `packages/ui` components use token references from `@salmon/shared` typography tokens instead of hardcoded numbers.

### Modified Capabilities
- `shared-ui-package`: The token contract now explicitly requires that components in `packages/ui` MUST NOT use hardcoded fontSize values — all must reference `fontSize.*` tokens.

## Impact

- **packages/shared**: `src/theme/typography.ts` — 5 new tokens added to `fontSize` object, exported types updated automatically via `as const`
- **packages/ui**: 44 component files modified (import changes + value replacements). Zero visual changes for values that map directly. Minor visual adjustments (~1-2px) for rounded values (11→10, 25→24, 32→30)
- **apps/mobile, apps/extension, apps/web**: No changes — they consume tokens from `@salmon/shared` which remains backward compatible
- **Risk**: Low — purely cosmetic token adoption with near-identical values. The 3 rounded values (11→10, 25→24, 32→30) affect only 14 total instances
