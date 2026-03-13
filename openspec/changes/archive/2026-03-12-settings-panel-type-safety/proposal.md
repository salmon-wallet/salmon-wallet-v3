## Why

`SettingsPanelStack` has two loose typing points: (1) `item.id as SettingsScreen` cast on line 333 where `SettingsItem.id` is `string` instead of `SettingsScreen`, and (2) no runtime warning when a panel is missing from `panelRegistry`. Both are low-severity but easy to fix with minimal changes.

## What Changes

- Change local `SettingsItem.id` type from `string` to `SettingsScreen | 'developerNetworks' | 'removeWallet' | 'removeAll'` (the non-panel action IDs) to eliminate the unsafe cast
- Add a `console.warn` in the panel rendering when `panelRegistry[entry.screen]` returns undefined
- Remove the `as SettingsScreen` cast, replacing with proper type narrowing
- No changes to any consumer code or public API

## Capabilities

### New Capabilities

- `settings-panel-type-guards`: Type-safe settings item IDs and runtime validation for missing panel renderers in SettingsPanelStack

### Modified Capabilities

_(none)_

## Impact

- **Affected code**: `packages/ui/src/components/SettingsPanelStack/SettingsPanelStack.tsx` (local SettingsItem interface + handleItemClick + panel render)
- **No consumer changes**: panelRegistry type and SettingsPanelStackProps remain identical
- **Risk**: Very low — type narrowing and a console.warn
