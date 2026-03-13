## Why

Screen-level files in `apps/web` and `apps/extension` bypass the design system by hardcoding hex colors, rgba values, fontSize, spacing, and borderRadius values instead of using tokens from `@salmon/shared`. Some values use the wrong accent color (`#FF6B4A`/`#FF6B35` instead of `#FF5C45`). Additionally, `apps/extension` mixes `styled()`, `sx` props, and inline `style={{}}` in the same files, and `apps/web` uses `window.alert()` for error feedback instead of proper UI patterns.

## What Changes

- Replace all hardcoded hex colors and rgba values with `colors.*` tokens from `@salmon/shared`
- Replace all hardcoded `fontSize`, `spacing`, `borderRadius` pixel values with design tokens
- Fix wrong accent colors (`#FF6B4A`, `#FF6B35` → `colors.accent.primary`)
- Standardize styling in extension pages to use `styled()` components consistently (remove `sx` prop usage)
- Replace `window.alert()` calls in `apps/web` SwapTab with i18n-aware error handling

## Capabilities

### New Capabilities

_None — this is a consistency/cleanup change, not a new capability._

### Modified Capabilities

_None — no spec-level behavior changes, only implementation consistency._

## Impact

- **apps/web**: `HomePage.tsx`, `SwapTab.tsx`, `NftDetailRoute.tsx` — token replacements + alert removal
- **apps/extension**: `App.tsx`, `HomePage.tsx`, `CollectiblesPage.tsx`, `SwapPage.tsx`, `LockPage.tsx` — token replacements + styling standardization
- **packages/shared**: No changes needed (tokens already exist)
- **packages/ui**: No changes needed
- **Risk**: Low — purely cosmetic/consistency changes. Some subtle color shifts where wrong hex was used (e.g., `#FF6B4A` → `#FF5C45`)
