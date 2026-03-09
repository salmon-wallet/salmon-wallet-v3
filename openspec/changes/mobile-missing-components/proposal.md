## Why

Audit of `packages/ui/src/components` vs `apps/mobile/src/components` revealed two gaps:
1. No generic confirmation modal in mobile for destructive actions (burn NFT, remove wallet, delete contact). Web has `ConfirmDialog` but mobile has nothing equivalent.
2. All four settings selectors (Language, Network, Currency, Explorer) duplicate the same list rendering pattern (TouchableOpacity + checkmark + card styling). Web consolidates this with `SettingsSelectorList`.

## What Changes

- **New `ConfirmSheet` component** in `apps/mobile/src/components/` — a bottom sheet for confirming destructive/sensitive actions. Supports danger styling, optional password input, loading state. Uses existing `BottomSheetContainer`, `PrimaryButton`, `SecondaryButton`, and `PasswordInput`.
- **New `SettingsSelectorList` component** in `apps/mobile/src/components/` — a generic, reusable list for settings selection screens. Replaces the duplicated `.map()` + `TouchableOpacity` + checkmark pattern across all four selectors.
- **Refactor** `LanguageSelector`, `NetworkSelector`, `CurrencySelector`, `ExplorerSelector` to consume `SettingsSelectorList` instead of inlining their own list rendering.

## Capabilities

### New Capabilities
- `confirm-sheet`: Generic mobile bottom sheet for confirming destructive or password-protected actions
- `settings-selector-list`: Reusable mobile list component for settings selection screens

### Modified Capabilities

## Impact

- `apps/mobile/src/components/ConfirmSheet/` — new component
- `apps/mobile/src/components/SettingsSelectorList/` — new component
- `apps/mobile/src/components/LanguageSelector/LanguageSelector.tsx` — refactor to use SettingsSelectorList
- `apps/mobile/src/components/NetworkSelector/NetworkSelector.tsx` — refactor to use SettingsSelectorList
- `apps/mobile/src/components/CurrencySelector/CurrencySelector.tsx` — refactor to use SettingsSelectorList
- `apps/mobile/src/components/ExplorerSelector/ExplorerSelector.tsx` — refactor to use SettingsSelectorList
- `apps/mobile/src/components/index.ts` — add exports
- No shared package changes needed; all existing types/tokens are sufficient
