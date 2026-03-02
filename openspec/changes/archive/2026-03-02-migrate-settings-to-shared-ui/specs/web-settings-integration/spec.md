## ADDED Requirements

### Requirement: Web settings routes for all pages
The web app SHALL define routes in `apps/web/src/router.tsx` for all settings pages, following the existing lazy-loading pattern. Each route SHALL be protected by `AuthGuard`.

**Package:** `apps/web`

#### Scenario: All settings routes are accessible
- **WHEN** an authenticated user navigates to any settings URL
- **THEN** the corresponding settings page component is rendered
- **THEN** the routes include: `/settings/accounts`, `/settings/account/:id`, `/settings/account/:id/name`, `/settings/account/:id/avatar`, `/settings/account-add`, `/settings/security`, `/settings/backup`, `/settings/private-key`, `/settings/address-book`, `/settings/address-book/add`, `/settings/address-book/edit`, `/settings/about`

#### Scenario: Unauthenticated access is redirected
- **WHEN** an unauthenticated user navigates to a settings URL
- **THEN** the `AuthGuard` redirects to the auth flow

### Requirement: Web route wrappers for settings pages
Each web settings page SHALL have a thin route wrapper component in `apps/web/src/pages/settings/` that imports the shared component from `@salmon/ui`, wires navigation callbacks to `useNavigate()`, and provides any route-specific data (e.g., `accountId` from URL params via `useParams()`).

**Package:** `apps/web`

#### Scenario: Route wrapper wires navigation to React Router
- **WHEN** a settings page calls `onBack()`
- **THEN** the wrapper navigates to `/settings` (or the appropriate parent route)
- **WHEN** a settings page calls `onEditAccount(id)`
- **THEN** the wrapper navigates to `/settings/account/:id`

#### Scenario: Route wrapper extracts URL params
- **WHEN** the URL is `/settings/account/abc123`
- **THEN** the wrapper extracts `accountId` from `useParams()` and passes it to the shared component

### Requirement: Web SettingsPage hub includes all navigation items
The `SettingsPage` hub in web SHALL display menu items for all settings pages with correct navigation, organized in sections matching the extension's `SettingsSheet`: Account (Accounts, Avatar, Security, Backup, Private Key), Preferences (Language, Currency, Explorer), Advanced (Address Book, Trusted Apps, About, Support).

**Package:** `apps/web`

#### Scenario: All settings items are visible and navigable
- **WHEN** user opens the settings hub at `/settings`
- **THEN** all settings items are displayed with their labels and icons
- **WHEN** user clicks any settings item
- **THEN** the app navigates to the corresponding route

### Requirement: Web ExplorerPage is functional
The web `ExplorerPage` SHALL render the shared `ExplorerSelector` component with proper state wiring via `useUserConfig()`, replacing the current "coming soon" placeholder.

**Package:** `apps/web`

#### Scenario: User selects an explorer
- **WHEN** user navigates to `/settings/explorer`
- **THEN** the system displays available explorers for the active network
- **WHEN** user selects an explorer
- **THEN** the selection is persisted via `useUserConfig()`
- **THEN** the app navigates back to `/settings`

### Requirement: Web NetworkPage is functional
The web `NetworkPage` SHALL render the shared `NetworkSelector` component with proper state wiring, replacing the current "coming soon" placeholder.

**Package:** `apps/web`

#### Scenario: User selects a network
- **WHEN** user navigates to `/settings/network`
- **THEN** the system displays available networks
- **WHEN** user selects a network
- **THEN** the network switch is applied
- **THEN** the app navigates back to `/settings`

### Requirement: Web settings catch-all redirects to hub
The web router SHALL keep the `/settings/*` catch-all route that redirects unknown settings paths to `/settings`.

**Package:** `apps/web`

#### Scenario: Unknown settings path redirects
- **WHEN** user navigates to `/settings/nonexistent`
- **THEN** the app redirects to `/settings`
