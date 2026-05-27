## Why

All mobile components in `apps/mobile/src/components/` use hardcoded numeric `borderWidth` values (0.5, 0.75, 1, 2, 3) instead of shared design tokens from `@salmon/shared`. The web/extension components already use `borderWidth.*` tokens consistently. This creates a maintenance gap and visual inconsistency risk.

## What Changes

- Replace all ~63 hardcoded `borderWidth` numeric values in mobile components with `borderWidth.*` tokens
- Add `borderWidth` to imports in affected files
- Token mapping:
  - `0` → `borderWidth.none` (or remove property)
  - `0.5` → `borderWidth.actionButton`
  - `0.75` → `borderWidth.tokenListItem` or `borderWidth.sheet`
  - `1` → `borderWidth.thin`
  - `2` → `borderWidth.medium`
  - `3` → `borderWidth.heavy`

## Capabilities

### New Capabilities

_None — this is a refactor using existing tokens._

### Modified Capabilities

_None — no spec-level behavior changes._

## Impact

- **Affected package**: `apps/mobile` only (~34 component files)
- **Shared tokens**: `packages/shared/src/theme/spacing.ts` — `borderWidth` already exported, no changes needed
- **Risk**: Low — purely cosmetic refactor, values map 1:1 to existing tokens
- **No breaking changes**
