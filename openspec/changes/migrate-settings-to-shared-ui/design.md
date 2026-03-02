## Context

The extension has 12 settings page components implemented locally in `apps/extension/src/pages/settings/`. The web app is missing all of them — only 5 selector-based pages work (language, currency, trusted apps, support, and the hub), plus 2 placeholders (explorer, network).

Meanwhile, `packages/ui` already has a proven pattern for shared settings components: `CurrencySelector`, `LanguageSelector`, `ExplorerSelector`, `TrustedAppsSelector`, `SupportSelector`, `NetworkSelector`, `SettingsSelectorList`, and `SettingsPageLayout`. These components use callback props for navigation, letting each app wire its own navigation system (extension's state machine vs web's React Router).

The 12 pages to migrate follow the same MUI + Emotion + design tokens stack already used in `packages/ui`. The main challenge is abstracting away extension-specific navigation patterns into generic callback props.

### Current Architecture

| Layer | Extension | Web |
|-------|-----------|-----|
| Navigation | State machine (`setCurrentPage()`) | React Router (`navigate()`) |
| Page rendering | Switch statement in `HomePage.tsx` | Lazy-loaded routes in `router.tsx` |
| Shared selectors | Renders directly in switch cases | Thin route wrappers in `pages/settings/index.tsx` |
| Settings pages | Local in `apps/extension/src/pages/settings/` | Missing |
| Layout wrapper | `SettingsPageLayout` from `@salmon/ui` | Same |
| Styled utility | Local `../../utils/styled` | `@salmon/ui/utils/styled` (same code) |
| State/hooks | `useAccountsContext()`, `useAddressbook()`, etc. from `@salmon/shared` | Same |

### Existing Base Prop Types (in `packages/shared/src/types/ui/`)

Already defined: `AccountsPagePropsBase`, `AccountEditPagePropsBase`, `AccountAddPagePropsBase`, `SecurityPagePropsBase`, `SecurityPagePropsMobile`

Missing: `AccountNamePagePropsBase`, `AccountAvatarPagePropsBase`, `BackupPagePropsBase`, `PrivateKeyPagePropsBase`, `AddressBookPagePropsBase`, `AddressAddPagePropsBase`, `AddressEditPagePropsBase`, `AboutPagePropsBase`

## Goals / Non-Goals

**Goals:**
- Extract all 12 extension settings page components to `packages/ui` as shared components
- Both extension and web consume identical component implementations
- Extension retains identical behavior after migration (pure import path change)
- Web gains all 12 settings pages with proper React Router wiring
- Fix the 2 web placeholder pages (Explorer, Network)
- Define missing base prop types in `packages/shared`

**Non-Goals:**
- Redesigning the settings pages UI or adding new features
- Mobile settings pages (React Native, completely separate rendering engine)
- Adding new settings that don't exist yet (e.g., notification preferences)
- Changing the extension's state machine navigation system
- Refactoring the extension's `HomePage.tsx` switch statement beyond import path updates

## Decisions

### Decision 1: Components go in `packages/ui/src/components/{PageName}/`

Each settings page becomes a component directory in `packages/ui`, following the same PascalCase directory + barrel `index.ts` pattern used by existing shared components (e.g., `CurrencySelector/`, `TrustedAppsSelector/`).

**Why not a separate `pages/` directory?** The existing `packages/ui` structure doesn't distinguish between "page-level" and "component-level" — everything is a component. `SettingsPageLayout`, `PageShell`, and selectors like `CurrencySelector` are already page-level components living in `components/`. Introducing a `pages/` directory would create an inconsistent structure.

**Alternatives considered:**
- `packages/ui/src/pages/settings/` — Adds a new structural concept, inconsistent with existing pattern
- Keeping pages in extension and creating web copies — Violates DRY, the exact problem we're solving

### Decision 2: Callback-based props pattern (no internal navigation logic)

Shared settings components receive all navigation as callback props (`onBack`, `onEditAccount`, `onAddAccount`, etc.) and never call `navigate()` or `setCurrentPage()` internally. Each app provides its own navigation callbacks.

This matches the existing pattern used by `CurrencySelector` (`onSelectCurrency` + `onBack`) and `TrustedAppsSelector` (`onRevokeApp` + `onBack`).

**Extension wiring** (in `HomePage.tsx` switch):
```tsx
case 'accounts':
  return (
    <AccountsPage
      onBack={handleBack}
      onEditAccount={(id) => { setEditingAccountId(id); setCurrentPage('accountEdit'); }}
      onAddAccount={() => setCurrentPage('accountAdd')}
    />
  );
```

**Web wiring** (in route wrapper):
```tsx
export function AccountsRoute() {
  const navigate = useNavigate();
  return (
    <AccountsPage
      onBack={() => navigate('/settings')}
      onEditAccount={(id) => navigate(`/settings/account/${id}`)}
      onAddAccount={() => navigate('/settings/account-add')}
    />
  );
}
```

**Why not hooks-based navigation inside components?** Using `useNavigate()` inside shared components would couple them to React Router, breaking the extension which uses state machine navigation. Callbacks keep components framework-agnostic.

### Decision 3: Components consume hooks directly from `@salmon/shared`

Settings page components call `useAccountsContext()`, `useAddressbook()`, `useLanguage()`, etc. directly — they don't receive state as props. This matches how existing shared components already work (e.g., `SettingsSheet` calls `useTranslation()` directly).

**Why not pass all data as props?** The existing selectors already mix both patterns — `CurrencySelector` receives data as props while `SettingsSheet` uses hooks internally. For complex pages like `AccountsPage` that need multiple pieces of account state, threading everything through props would create unwieldy interfaces. Since both extension and web already wrap the same `AccountsContext` provider, hooks work identically in both.

**Exception:** Navigation callbacks remain as props (Decision 2) since they differ per app.

### Decision 4: Extension keeps thin switch-case wiring in `HomePage.tsx`

The extension's `HomePage.tsx` switch statement stays as-is structurally. Only the imports change — from `@/pages/settings` to `@salmon/ui`. The callback props passed to each component remain identical.

The extension's `apps/extension/src/pages/settings/` directory is deleted entirely after migration (all components move to `packages/ui`). The barrel `index.ts` in extension is no longer needed.

### Decision 5: Web uses route wrappers pattern for all settings pages

Each web settings page gets a thin route wrapper component in `apps/web/src/pages/settings/index.tsx` (extending the existing pattern used for `CurrencyPage`, `LanguagePage`, etc.). These wrappers:

1. Import the shared component from `@salmon/ui`
2. Wire `onBack` and navigation callbacks to `useNavigate()`
3. Provide any route-specific data (e.g., `accountId` from URL params)

New routes are added to `apps/web/src/router.tsx` following the existing lazy-loading pattern.

### Decision 6: Use `styled` from `@salmon/ui/utils/styled`

All migrated components use the shared `styled` utility already available in `packages/ui/src/utils/styled.ts`. The extension currently imports from a local `../../utils/styled` — these imports simply change to the relative path within `packages/ui`.

Transient props use `$` prefix (e.g., `$isActive`) following the convention established in commit `afec889`.

### Decision 7: Missing base prop types defined in `packages/shared/src/types/ui/`

Create base prop type interfaces for the 8 pages that don't have them yet, following the same pattern as existing types (`AccountsPagePropsBase`, `SecurityPagePropsBase`):

| New Type | Key Props |
|----------|-----------|
| `AccountNamePagePropsBase` | `accountId`, `currentName`, `onSave(name)`, `onBack` |
| `AccountAvatarPagePropsBase` | `accountId`, `onSelectAvatar(avatar)`, `onBack` |
| `BackupPagePropsBase` | `onBack` |
| `PrivateKeyPagePropsBase` | `onBack` |
| `AddressBookPagePropsBase` | `onAddContact`, `onEditContact(contact)`, `onBack` |
| `AddressAddPagePropsBase` | `onSave`, `onBack` |
| `AddressEditPagePropsBase` | `contact`, `onSave`, `onBack` |
| `AboutPagePropsBase` | `onBack` |

Note: Pages that consume shared hooks internally (like `BackupPage` reading the mnemonic from `useAccountsContext()`) have minimal prop interfaces. This is intentional — Decision 3.

## Risks / Trade-offs

**[Risk] Extension behavior regression after import migration** → Mitigation: This is a pure import-path change for extension. The components, props, hooks, and styled patterns remain identical. Typecheck (`pnpm turbo run typecheck --filter=@salmon/extension --filter=@salmon/ui`) catches any mismatches. Manual smoke test of each settings page in extension popup.

**[Risk] Increased `packages/ui` bundle size** → Mitigation: All 12 pages already exist in the extension bundle. Moving them to `packages/ui` doesn't add new code — it just shares existing code. Both apps use tree-shaking (Vite), so unused pages aren't bundled. Net effect is a smaller total bundle (one copy instead of two).

**[Risk] Styled component import paths break during migration** → Mitigation: All styled components in migrated pages must use the `styled` utility from `packages/ui/src/utils/styled` (relative imports within the package). A global search-and-replace of `from '../../utils/styled'` to the correct relative path handles this.

**[Risk] Some extension pages may have hidden `chrome.*` API dependencies** → Mitigation: The audit confirmed none of the 12 settings pages use browser extension APIs. They only use `@salmon/shared` hooks, MUI, and design tokens. The components that DO use chrome APIs (dApp pages, session management) remain in the extension.

**[Trade-off] Components call hooks directly vs receiving all data as props** → Components are slightly less "pure" but significantly simpler to use. Both apps share the same context providers, so hooks work identically. If a future consumer needs different data sourcing, the base prop types can be extended to accept data overrides.

**[Trade-off] Web route wrappers are very thin (mostly just navigation wiring)** → This is the same pattern already established by `CurrencyPage`, `LanguagePage`, etc. The thinness is a feature — it means the shared component does all the work, and the wrapper only adapts the navigation system.
