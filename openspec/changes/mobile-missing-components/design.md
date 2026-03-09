## Context

Mobile app lacks two components that web/extension already have:
1. A generic confirmation modal for destructive actions (web has `ConfirmDialog` using `BaseDialog`)
2. A shared selector list component (web has `SettingsSelectorList` using MUI List)

Mobile already has the building blocks: `BottomSheetContainer` (slide-up modal with drag-to-dismiss), `PrimaryButton`/`SecondaryButton`, `PasswordInput`, and consistent design tokens.

## Goals / Non-Goals

**Goals:**
- Create `ConfirmSheet` — mobile-native confirmation bottom sheet matching `ConfirmDialog` capabilities
- Create `SettingsSelectorList` — generic list to deduplicate 4 selectors
- Refactor all 4 selectors to use the new shared list

**Non-Goals:**
- No changes to `packages/shared` or `packages/ui` — this is mobile-only
- No new i18n keys — reuse existing `actions.cancel`, `actions.confirm`, `errors.password_required`, `errors.invalid_password`
- No changes to web/extension `ConfirmDialog` or `SettingsSelectorList`

## Decisions

### D1: ConfirmSheet uses BottomSheetContainer (not a new modal)

Reuse `BottomSheetContainer` as the base. It already handles animations, backdrop, drag-to-dismiss, Android back button. ConfirmSheet just composes content inside it.

**Alternative considered:** Building a centered Alert-style modal. Rejected because all mobile modals use bottom sheet pattern consistently.

### D2: ConfirmSheet is a small fixed-height sheet

Override `BottomSheetContainer` style to use smaller height (`minHeight: undefined`, let content determine height). Confirmation dialogs don't need 70% screen height.

### D3: SettingsSelectorList is generic with render props

Use TypeScript generics `<T>` matching the web pattern. Props: `items`, `getKey`, `isSelected`, `onSelect`, `getPrimaryText`, `getSecondaryText?`, `renderLeadingElement?`, `loading?`, `emptyMessage?`.

**Alternative considered:** A simpler component with fixed item shape. Rejected because each selector has different item types (LanguageSelectorItem, NetworkSelectorItem, etc.).

### D4: Selectors keep their own SettingsScreenLayout wrapper

`SettingsSelectorList` only handles the list items. Each selector still wraps with `SettingsScreenLayout` for title/back. This keeps the component focused and matches how the web version works.

## Risks / Trade-offs

- [ConfirmSheet height] Small sheets may feel odd in the bottom sheet pattern → Use appropriate padding and min content to feel natural. Disable drag-to-dismiss to prevent accidental dismissal of confirmation dialogs.
- [Selector refactor] Slight API change for selectors → Pure internal refactor, no prop changes for consumers.

## Migration Plan

No migration needed. New components, then refactor selectors in place. No breaking changes.

## Open Questions

None — all decisions are straightforward given existing patterns.
