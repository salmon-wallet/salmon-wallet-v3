## 1. Type-safe SettingsItem IDs

- [ ] 1.1 In `packages/ui/src/components/SettingsPanelStack/SettingsPanelStack.tsx`, change the local `SettingsItem` interface `id` field from `string` to `SettingsScreen | 'developerNetworks'` (import `SettingsScreen` from `@salmon/shared` if not already imported).
- [ ] 1.2 Remove the `as SettingsScreen` cast in `handleItemClick` (line 333). Add type narrowing: check if `item.id` is not `'developerNetworks'` before calling `handlePush(item.id)`.
- [ ] 1.3 Verify `SETTINGS_SECTIONS` compiles without errors after the type change — TypeScript will flag any mismatched IDs.

## 2. Runtime warning for missing panels

- [ ] 2.1 In the panel rendering section (around line 457), add a `console.warn` when `panelRegistry[entry.screen]` is undefined, and return `null` for that panel entry.

## 3. Verify

- [ ] 3.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/ui`
