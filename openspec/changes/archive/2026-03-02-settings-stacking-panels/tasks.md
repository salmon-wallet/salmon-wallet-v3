## 1. Shared Types & Hook

- [x] 1.1 Add `SettingsPanelEntry` type to `packages/shared/src/types/settings.ts` (`{ screen: SettingsScreen; props?: Record<string, unknown> }`) and remove `onNavigate` from `SettingsSheetBaseProps`. Export from barrel.
- [x] 1.2 Create `useSettingsPanelStack` hook in `packages/shared/src/hooks/useSettingsPanelStack.ts` with `push`, `pop`, `reset`, `current`, `stack`, `canGoBack`. Export from barrel.

## 2. Rename SettingsPageLayout → SettingsPanelContent (packages/ui)

- [x] 2.1 Rename directory `packages/ui/src/components/SettingsPageLayout/` to `SettingsPanelContent/`, rename the component file and all internal references. Update barrel export in `packages/ui/src/components/index.ts`.
- [x] 2.2 Update all imports of `SettingsPageLayout` across the codebase to `SettingsPanelContent` (search in `packages/ui`, `apps/extension`, `apps/web`).

## 3. DOM Panel Stack Component (packages/ui)

- [x] 3.1 Create `packages/ui/src/components/SettingsPanelStack/` with the panel stack container: single MUI Drawer that renders stacked panels with CSS `transform: translateX` slide animations (250ms ease-out push, 200ms ease-in pop). Include types and barrel export.
- [x] 3.2 Create the panel content registry in `packages/ui/src/components/SettingsPanelStack/` that maps each `SettingsScreen` to its corresponding content component (`LanguageSelector`, `CurrencySelector`, `AccountsPage`, `SecurityPage`, etc.). Each registry entry wires the component with the props it needs from existing context hooks.
- [x] 3.3 Refactor `SettingsSheet` in `packages/ui/src/components/SettingsSheet/` to become the base panel content (panel 0). Replace `onNavigate` dispatch with `push()` from `useSettingsPanelStack`. The `SettingsPanelStack` component wraps `SettingsSheet` content + stacked sub-panels inside a single Drawer.

## 4. Integrate Panel Stack in Extension

- [x] 4.1 Update `apps/extension/src/pages/home/HomePage.tsx`: replace `<SettingsSheet>` with `<SettingsPanelStack>`. Remove `handleSettingsNavigate` callback. Pass through all existing settings-related props (developer networks, remove wallet, etc.).
- [x] 4.2 Remove all settings-related `PageView` entries and their switch/case blocks from `HomePage.tsx`: `backup`, `currency`, `about`, `language`, `explorer`, `addressBook`, `addressBookAdd`, `addressBookEdit`, `trustedApps`, `security`, `support`, `privateKey`, `avatar`, `accounts`, `accountEdit`, `accountName`, `accountAdd`. Clean up the `PageView` type.

## 5. Integrate Panel Stack in Web

- [x] 5.1 Refactor `apps/web/src/pages/settings/SettingsPage.tsx` to open the `SettingsPanelStack` drawer instead of showing a hub page with links. The `/settings` route triggers the panel stack.
- [x] 5.2 Remove all `/settings/*` sub-routes from `apps/web/src/router.tsx` (keep `/settings` and the catch-all redirect).
- [x] 5.3 Delete all route wrapper components from `apps/web/src/pages/settings/index.tsx` (18 wrappers: `LanguagePage`, `CurrencyPage`, `ExplorerPage`, `SupportPage`, `TrustedAppsPage`, `NetworkPage`, `AccountsRoute`, `AccountEditRoute`, `AccountNameRoute`, `AccountAvatarRoute`, `AccountAddRoute`, `SecurityRoute`, `BackupRoute`, `PrivateKeyRoute`, `AddressBookRoute`, `AddressAddRoute`, `AddressEditRoute`, `AboutRoute`).

## 6. Mobile Panel Stack Component

- [x] 6.1 Create `apps/mobile/src/components/SettingsPanelStack/` with React Native panel stack using `react-native-reanimated`: `translateX` slide animations (300ms, `Easing.out(Easing.cubic)` for push, `Easing.in(Easing.cubic)` for pop). Include swipe-right gesture (PanResponder, 80px threshold) to pop.
- [x] 6.2 Create the mobile panel content registry in `apps/mobile/src/components/SettingsPanelStack/` that maps each `SettingsScreen` to its mobile content component. Wire each with the props it needs from existing context hooks.
- [x] 6.3 Refactor `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx` to use the panel stack internally. Replace `onNavigate` callback dispatch with `push()` from `useSettingsPanelStack`. The TopSheet wraps the panel stack.

## 7. Integrate Panel Stack in Mobile

- [x] 7.1 Update `apps/mobile/app/(app)/(tabs)/_layout.tsx`: remove `handleSettingsNavigate` that calls `router.push()`. Replace `<SettingsSheet>` with the new integrated SettingsSheet+PanelStack. Pass through all existing settings-related props.
- [x] 7.2 Delete all settings screen files from `apps/mobile/app/(app)/(tabs)/settings/` — approximately 20 files: `about.tsx`, `account-add.tsx`, `account-edit.tsx`, `account-name.tsx`, `accounts.tsx`, `address-book-add.tsx`, `address-book-edit.tsx`, `address-book.tsx`, `avatar.tsx`, `backup.tsx`, `currency.tsx`, `explorer.tsx`, `language.tsx`, `network.tsx`, `privateKey.tsx`, `security.tsx`, `support.tsx`, `trusted-apps.tsx`. Keep `_layout.tsx` and `index.tsx` only if needed for Expo Router structure, otherwise delete entire directory.

## 8. Cleanup & Verification

- [x] 8.1 Run typecheck across shared, ui, extension, web, and mobile (`pnpm turbo run typecheck`). Fix any broken imports or type errors from removed `onNavigate`, renamed components, or deleted files.
- [x] 8.2 Search codebase for any remaining references to deleted files, old `SettingsPageLayout` name, or `onNavigate` in settings contexts. Remove dead imports and unused variables.
