## Context

Audit of `apps/web` and `apps/extension` revealed hardcoded colors, typography, spacing, and borderRadius values in screen-level files. The design tokens already exist in `@salmon/shared` — no new tokens are needed. This is a mechanical replacement task.

Key token mappings:
- `#FF6B4A` / `#FF6B35` → `colors.accent.primary` (`#FF5C45`)
- `rgba(255,255,255,0.6)` → `colors.text.muted`
- `rgba(255,255,255,0.4)` → `colors.text.disabled`
- `rgba(255,255,255,0.05)` → `colors.background.card`
- `#0f0f0f` → `colors.background.primary`
- `fontSize: 12` → `fontSize.sm`, `14` → `fontSize.base`, `16` → `fontSize.md`, `18` → `fontSize.lg`, `20` → `fontSize.xl`
- `borderRadius: 12` → `borderRadius.lg`
- `marginTop: 24` → `spacing['2xl']`

## Goals / Non-Goals

**Goals:**
- All color, typography, spacing, and borderRadius values use design tokens from `@salmon/shared`
- Extension styling uses `styled()` consistently (no `sx` prop mixing in page files)
- Web `window.alert()` calls replaced with `console.error` + existing error handling patterns
- Typecheck and lint pass clean after changes

**Non-Goals:**
- Adding new design tokens (all needed tokens already exist)
- Refactoring component architecture
- Adding i18n keys for error messages (separate task — just remove window.alert for now)
- Fixing animation durations (minor, separate concern)

## Decisions

1. **Token mapping approach**: Direct 1:1 replacement using closest semantic token. Where exact value doesn't exist (e.g., `rgba(255,107,53,0.2)`), use the closest available token (`colors.accent.tint`).

2. **window.alert replacement**: Replace with `console.error()` for now. A proper toast/snackbar system is a separate feature. The swap errors are already caught and logged — `window.alert` was just a placeholder.

3. **Extension sx→styled migration**: Only migrate `sx` props in page-level files where they coexist with `styled()` components. Leave `sx` usage alone in files that consistently use only `sx` (consistency within a file > consistency across files).

4. **Extension spinner in App.tsx**: The loading spinner uses CSS keyframes with hardcoded colors. Replace with token values in the existing inline style object.

## Risks / Trade-offs

- [Subtle color shifts] `#FF6B4A` → `#FF5C45` changes the accent slightly. This is intentional — the hardcoded values were wrong.
- [No user-facing error feedback] Removing `window.alert` without adding toast means swap errors are only logged to console for now. Acceptable as a temporary state.
