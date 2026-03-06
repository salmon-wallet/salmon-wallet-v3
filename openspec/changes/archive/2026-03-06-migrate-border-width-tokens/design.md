## Context

All mobile components in `apps/mobile/src/components/` use hardcoded numeric `borderWidth` values (0, 0.5, 0.75, 1, 2, 3) instead of shared design tokens from `@salmon/shared`. The web/extension components (`packages/ui/`) already use `borderWidth.*` tokens consistently. The tokens already exist in `packages/shared/src/theme/spacing.ts`.

## Goals / Non-Goals

**Goals:**
- Replace all ~63 hardcoded `borderWidth` numeric values in mobile components with `borderWidth.*` tokens
- Achieve parity with web/extension token usage

**Non-Goals:**
- Adding new tokens to `packages/shared/src/theme/spacing.ts`
- Changing any visual appearance (1:1 value mapping)
- Modifying web/extension components

## Decisions

### 1. Token mapping strategy
Use the existing `borderWidth` tokens from `packages/shared/src/theme/spacing.ts`:

| Hardcoded value | Token | Rationale |
|---|---|---|
| `0` | Remove property or keep as `0` | No token needed for zero |
| `0.5` | `borderWidth.actionButton` | Matches web usage (0.5) |
| `0.75` | `borderWidth.tokenListItem` or `borderWidth.sheet` | Both are 0.75; pick based on component context |
| `1` | `borderWidth.thin` | Matches web usage (1) |
| `2` | `borderWidth.medium` | Matches web usage (2) |
| `3` | `borderWidth.heavy` | Matches web usage (3) |

### 2. Import approach
Add `borderWidth` to existing `@salmon/shared` imports in each affected file. Most files already import from `@salmon/shared`.

### 3. BlurContainer borderWidth prop
Some components pass `borderWidth` as a prop to `BlurContainer`. These should also use the token: `borderWidth={borderWidth.actionButton}` instead of `borderWidth={0.5}`.

## Risks / Trade-offs

- **[Risk] Ambiguous 0.75 mapping** → Use component context to choose between `borderWidth.tokenListItem` and `borderWidth.sheet`. Check web counterpart for guidance.
- **[Risk] Name collision with StyleSheet property** → The token object `borderWidth` has the same name as the CSS property. Use destructured or qualified import to avoid confusion. In StyleSheet objects, `borderWidth: borderWidth.thin` reads clearly.
