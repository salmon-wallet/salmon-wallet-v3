## Context

`packages/ui` has ~106 hardcoded spacing values across 23 files. The shared token system defines spacing from `2xs`(2) through `8xl`(96). Most hardcoded values map directly; a few need rounding or a new token.

## Goals / Non-Goals

**Goals:**
- Replace all hardcoded spacing values in `packages/ui` with `spacing.*` token references
- Add `spacing['3.5xl']` = 30 for the BalanceCardCarousel shadow hack
- Round values without exact tokens upward: 3→4, 6→8, 7→8, 14→16

**Non-Goals:**
- Changing component dimensions (width/height of icons, buttons, etc.)
- Modifying mobile components
- Refactoring padding strings into separate properties (keep template literal approach)

## Decisions

1. **Rounding strategy**: Always round UP to nearest token. 3→xs(4), 6→sm(8), 7→sm(8), 14→lg(16). Max 2px change on non-critical elements.

2. **New token `3.5xl` = 30**: Used specifically for BalanceCardCarousel shadow overflow padding hack. Between `3xl`(32) and `2xl`(24), the value 30 is intentional for the shadow radius.

3. **Padding strings**: Convert `'14px 16px'` to `` `${spacing.lg}px ${spacing.lg}px` `` (after rounding 14→16). Convert `'3px 8px'` to `` `${spacing.xs}px ${spacing.sm}px` `` (after rounding 3→4).

4. **Micro-adjustments (value 2)**: Tokenize with `spacing['2xs']` for consistency, even though they're small visual tweaks.

5. **Import pattern**: Add `spacing` to existing `@salmon/shared` import in each file.

## Risks / Trade-offs

- **Minor visual rounding**: 19 instances shift by 1-2px. All are secondary UI elements (badge padding, grid gaps, attribute chips).
- **Token set growth**: Only 1 new token (`3.5xl`). Minimal impact.
- **No breaking changes**: All existing tokens unchanged.
