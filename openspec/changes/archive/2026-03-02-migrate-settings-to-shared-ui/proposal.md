## Why

The extension app has 12 fully implemented settings pages (accounts, security, backup, private key, address book, about, etc.) that live locally in `apps/extension/src/pages/settings/`. The web app is missing all of these — it only has 5 working settings pages (language, currency, trusted apps, support, and the hub) plus 2 placeholders (explorer, network). This violates the feature parity principle and duplicates effort. By extracting the extension's settings page components into `packages/ui` as shared components, both extension and web can consume identical implementations, and adding settings pages to web becomes trivial.

## What Changes

- **Extract 12 settings page components** from `apps/extension/src/pages/settings/` to `packages/ui/src/components/` as shared components: `AccountsPage`, `AccountEditPage`, `AccountNamePage`, `AccountAvatarPage`, `AccountAddPage`, `SecurityPage`, `BackupPage`, `PrivateKeyPage`, `AddressBookPage`, `AddressAddPage`, `AddressEditPage`, `AboutPage`
- **Update extension imports** to consume all migrated pages from `@salmon/ui` instead of local paths
- **Remove local extension copies** of migrated page components (no duplication)
- **Create web settings routes and pages** for all 12 migrated components, wiring them into the existing React Router config at `/settings/*`
- **Fix ExplorerPage and NetworkPage** placeholder pages in web to use the existing `ExplorerSelector` and `NetworkSelector` shared components with proper state wiring
- **Define shared base prop types** in `packages/shared/src/types/ui/` for any settings pages that don't already have them, following the established base props pattern
- **Update the web SettingsPage hub** menu to include navigation to all new settings routes

## Capabilities

### New Capabilities
- `shared-settings-pages`: Shared settings page components extracted to `packages/ui` — covers AccountsPage, AccountEditPage, AccountNamePage, AccountAvatarPage, AccountAddPage, SecurityPage, BackupPage, PrivateKeyPage, AddressBookPage, AddressAddPage, AddressEditPage, and AboutPage as reusable React DOM components
- `web-settings-integration`: Web app routes, page wrappers, and navigation for all settings pages — covers router config, settings hub menu updates, and per-page wiring

### Modified Capabilities
- `shared-ui-package`: Component extraction list expands to include the 12 settings page components
- `account-list`: Add web as a target platform (currently only mobile + extension)
- `account-edit`: Add web as a target platform
- `account-add`: Add web as a target platform
- `security-settings`: Add web as a target platform

## Impact

- **packages/shared**: New/updated base prop types in `src/types/ui/` for settings pages that lack them (backup, private-key, address-book, about)
- **packages/ui**: 12 new component directories under `src/components/`, updated barrel exports in `src/components/index.ts`
- **apps/extension**: Import paths change from `@/pages/settings/*` to `@salmon/ui` for all migrated components; local files deleted from `src/pages/settings/`; `HomePage.tsx` switch statement updated to use shared components
- **apps/web**: New routes in `src/router.tsx`, new page wrapper components in `src/pages/settings/`, updated `SettingsPage.tsx` hub menu
- **No mobile impact**: Mobile uses React Native and has its own component implementations
- **No breaking API changes**: Extension retains identical behavior — pure refactor of import paths
