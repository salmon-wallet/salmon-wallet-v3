## Context

`packages/ui` has 273 hardcoded `fontSize` numeric values across 44 component files. The shared design token system in `@salmon/shared` defines a `fontSize` object with 14 tokens. 174 of the hardcoded values map directly to existing tokens. The remaining 99 use values (11, 13, 15, 22, 25, 28, 32, 40) that either need new tokens or can be rounded to existing ones.

## Goals / Non-Goals

**Goals:**
- Replace all 273 hardcoded fontSize values in `packages/ui` with `fontSize.*` token references
- Add 5 new fontSize tokens for values with no close match: `caption` (13), `body` (15), `title` (22), `iconMd` (28), `iconLg` (40)
- Round 14 instances to nearest existing token: `11→xs(10)`, `25→2xl(24)`, `32→3xl(30)`

**Non-Goals:**
- Changing any visual design (font sizes stay the same or differ by max 2px for rounded values)
- Modifying mobile components (they already use tokens correctly)
- Refactoring font weights or letter spacing (separate change)
- Adding responsive scaling (`ms()`) wrappers — components that already use scaling keep it, others stay as-is

## Decisions

1. **New token naming**: Use semantic names (`caption`, `body`, `title`) for text-related sizes and `iconMd`/`iconLg` for MUI icon sx sizes. These follow the existing naming pattern (`xs`, `sm`, `base`, `md`, `lg`, `xl`).

2. **Rounding strategy**: Values 11, 25, and 32 are each used ≤12 times. Rounding to nearest token (10, 24, 30) introduces ≤2px change — imperceptible at these scales. This avoids token bloat.

3. **Icon fontSize in sx props**: Many hardcoded values are MUI icon sizes via `sx={{ fontSize: N }}`. These still get tokenized — `fontSize.xs` through `fontSize.iconLg` — to maintain consistency.

4. **Import pattern**: Each file adds `fontSize` to its existing `@salmon/shared` import. Files that already import `fontSize` only need value replacements.

5. **Execution order**: Add tokens to `packages/shared` first, then update `packages/ui` files alphabetically by component directory.

## Risks / Trade-offs

- **Minor visual rounding** (11→10, 25→24, 32→30): 14 instances across 10 files will shift by 1-2px. All are secondary/tertiary text or icons — low visual impact.
- **Token set growth**: Adding 5 tokens increases `fontSize` from 14 to 19 entries. This is acceptable — the alternatives (more rounding or leaving hardcoded) are worse.
- **No breaking changes**: All existing tokens retain their values. New tokens are additive.
