## 1. Define missing base prop types in packages/shared

- [x] 1.1 Create `BackupPagePropsBase` and `PrivateKeyPagePropsBase` type interfaces in `packages/shared/src/types/ui/` with `onBack` prop, and export from the types barrel
- [x] 1.2 Create `AddressBookPagePropsBase`, `AddressAddPagePropsBase`, `AddressEditPagePropsBase` type interfaces in `packages/shared/src/types/ui/` with navigation callback props (`onAddContact`, `onEditContact`, `onSave`, `onBack`), and export from the types barrel
- [x] 1.3 Create `AboutPagePropsBase` type interface in `packages/shared/src/types/ui/` with `onBack` prop, and export from the types barrel
- [x] 1.4 Verify existing types `AccountsPagePropsBase`, `AccountEditPagePropsBase`, `AccountAddPagePropsBase`, `SecurityPagePropsBase` are sufficient for the shared component pattern — update if callback props are missing

## 2. Migrate account management pages to packages/ui

- [x] 2.1 Move `AccountsPage` to `packages/ui/src/components/AccountsPage/` — create directory, component file, barrel `index.ts`; update imports from `@salmon/shared` and relative `styled`; use `$`-prefix transient props; ensure callback-based navigation props (`onBack`, `onEditAccount`, `onAddAccount`)
- [x] 2.2 Move `AccountEditPage` to `packages/ui/src/components/AccountEditPage/` — same pattern; callback props for `onEditName`, `onEditAvatar`, `onBackupSeed`, `onExportPrivateKey`, `onBack`; accepts `accountId` prop
- [x] 2.3 Move `AccountNamePage` to `packages/ui/src/components/AccountNamePage/` — same pattern; accepts `accountId` and `onBack`; calls `editAccount()` internally via `useAccountsContext()`
- [x] 2.4 Move `AccountAvatarPage` to `packages/ui/src/components/AccountAvatarPage/` — same pattern; tabbed interface (Presets + NFTs); accepts `accountId` and `onBack`
- [x] 2.5 Move `AccountAddPage` to `packages/ui/src/components/AccountAddPage/` — same pattern; multi-step flow; accepts `onBack` and `onComplete`

## 3. Migrate security and backup pages to packages/ui

- [x] 3.1 Move `SecurityPage` to `packages/ui/src/components/SecurityPage/` — change password form with `PasswordInput` and `PasswordStrengthBar`; accepts `onBack`; uses `useAccountsContext()` for `changePassword()`
- [x] 3.2 Move `BackupPage` to `packages/ui/src/components/BackupPage/` — seed phrase word grid with reveal overlay, copy-to-clipboard, security warning; accepts `onBack`
- [x] 3.3 Move `PrivateKeyPage` to `packages/ui/src/components/PrivateKeyPage/` — network selection + key reveal/copy; accepts `onBack`

## 4. Migrate address book pages to packages/ui

- [x] 4.1 Move `AddressBookPage` to `packages/ui/src/components/AddressBookPage/` — contact list with edit/delete; callback props `onAddContact`, `onEditContact`, `onBack`; uses `useAddressbook()`
- [x] 4.2 Move `AddressAddPage` to `packages/ui/src/components/AddressAddPage/` — form with label, address validation, network; accepts `onBack` and `onSave`; uses `useAddressBookForm()`
- [x] 4.3 Move `AddressEditPage` to `packages/ui/src/components/AddressEditPage/` — pre-filled edit form; accepts `contact`, `onBack`, `onSave`

## 5. Migrate about page to packages/ui

- [x] 5.1 Move `AboutPage` to `packages/ui/src/components/AboutPage/` — app version, link sections (General, Legal, Social); accepts `onBack`

## 6. Update packages/ui barrel exports

- [x] 6.1 Add all 12 migrated components to `packages/ui/src/components/index.ts` barrel exports following the existing named export pattern

## 7. Update extension to consume from @salmon/ui

- [x] 7.1 Update `apps/extension/src/pages/home/HomePage.tsx` imports — replace `import { AccountsPage, SecurityPage, ... } from '@/pages/settings'` with `import { AccountsPage, SecurityPage, ... } from '@salmon/ui'`; verify all callback props remain unchanged
- [x] 7.2 Delete `apps/extension/src/pages/settings/` directory (all 12+ local page files and barrel index.ts) — these are now served from `packages/ui`
- [x] 7.3 Run `pnpm turbo run typecheck --filter=@salmon/ui --filter=@salmon/extension` and fix any type errors

## 8. Create web route wrappers and routes

- [x] 8.1 Add route wrapper components for account pages in `apps/web/src/pages/settings/index.tsx`: `AccountsRoute`, `AccountEditRoute`, `AccountNameRoute`, `AccountAvatarRoute`, `AccountAddRoute` — each wires `useNavigate()` and `useParams()` to the shared component's callback props
- [x] 8.2 Add route wrapper components for security/backup pages: `SecurityRoute`, `BackupRoute`, `PrivateKeyRoute`
- [x] 8.3 Add route wrapper components for address book pages: `AddressBookRoute`, `AddressAddRoute`, `AddressEditRoute`
- [x] 8.4 Add route wrapper component for about page: `AboutRoute`
- [x] 8.5 Add all new routes to `apps/web/src/router.tsx` with lazy-loading pattern inside the `AuthGuard` children: `/settings/accounts`, `/settings/account/:id`, `/settings/account/:id/name`, `/settings/account/:id/avatar`, `/settings/account-add`, `/settings/security`, `/settings/backup`, `/settings/private-key`, `/settings/address-book`, `/settings/address-book/add`, `/settings/address-book/edit`, `/settings/about`

## 9. Fix web placeholder pages and update settings hub

- [x] 9.1 Fix `ExplorerPage` in `apps/web/src/pages/settings/index.tsx` — replace "coming soon" placeholder with proper `ExplorerSelector` wiring via `useUserConfig()`
- [x] 9.2 Fix `NetworkPage` in `apps/web/src/pages/settings/index.tsx` — replace "coming soon" placeholder with proper `NetworkSelector` wiring
- [x] 9.3 Update `apps/web/src/pages/settings/SettingsPage.tsx` hub menu to include all settings items organized in sections (Account, Preferences, Advanced) with correct route navigation

## 10. Final verification

- [x] 10.1 Run `pnpm turbo run typecheck --filter=@salmon/ui --filter=@salmon/extension --filter=@salmon/web` and fix any type errors
- [x] 10.2 Verify no duplicate settings page code exists in `apps/extension/src/pages/settings/` (directory should be deleted)
- [x] 10.3 Verify all 12 shared components are importable from `@salmon/ui` barrel export
