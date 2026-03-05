## Why

`packages/ui` has ~106 hardcoded spacing values (padding, margin, gap) across 23 files. This breaks the design token contract and creates inconsistency with mobile. All values should reference `spacing.*` tokens from `@salmon/shared`.

## What Changes

- **Add 1 new spacing token** to `packages/shared/src/theme/spacing.ts`: `spacing['3.5xl']` = 30 (used in BalanceCardCarousel shadow overflow hack)
- **Replace ~69 hardcoded values** that map directly to existing tokens (2→2xs, 4→xs, 8→sm, 10→base, 12→md, 16→lg, 18→headerPadding, 24→2xl, 32→3xl, 48→5xl)
- **Round ~19 hardcoded values** up to nearest token: 3→xs(4), 6→sm(8), 7→sm(8), 14→lg(16)
- **Convert padding strings** (`'14px 16px'`, `'3px 8px'`, etc.) to use token references with template literals

## Capabilities

### New Capabilities
- `web-spacing-tokens`: All spacing values in `packages/ui` components use token references from `@salmon/shared` instead of hardcoded numbers.

### Modified Capabilities
- `shared-ui-package`: The token contract now explicitly requires that components in `packages/ui` MUST NOT use hardcoded spacing values.

## Impact

- **packages/shared**: `src/theme/spacing.ts` — 1 new token added (`3.5xl` = 30)
- **packages/ui**: 23 component files modified. Minor visual adjustments for rounded values (3→4, 6→8, 7→8, 14→16 — max 2px difference)
- **apps/mobile, apps/extension, apps/web**: No changes — backward compatible
- **Risk**: Low — max 2px rounding on secondary elements (badges, grid gaps, paddings)
