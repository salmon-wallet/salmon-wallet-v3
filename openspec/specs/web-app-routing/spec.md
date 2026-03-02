## ADDED Requirements

### Requirement: React Router with createBrowserRouter
The web app SHALL use `react-router-dom` v7 with `createBrowserRouter` and `RouterProvider`. Routes MUST be defined in a dedicated `router.tsx` file.

#### Scenario: URL navigation works
- **WHEN** a user navigates to `/home` in the browser
- **THEN** the HomePage component renders
- **THEN** the URL reflects the current view

#### Scenario: Back/forward browser buttons work
- **WHEN** a user clicks the browser back button after navigating from `/home` to `/token/SOL`
- **THEN** the app navigates back to `/home`

### Requirement: Auth guard protects wallet routes
An `AuthGuard` component SHALL wrap all authenticated routes. It MUST check `useAccountsContext()` and redirect based on wallet state: not ready → loading spinner, locked → `/lock`, no accounts → `/auth/select`.

#### Scenario: Unauthenticated user redirected
- **WHEN** a user with no wallet visits `/home`
- **THEN** they are redirected to `/auth/select`

#### Scenario: Locked wallet redirected
- **WHEN** a user with a locked wallet visits `/home`
- **THEN** they are redirected to `/lock`

#### Scenario: Unlocked wallet proceeds
- **WHEN** a user with an unlocked wallet visits `/home`
- **THEN** the HomePage renders normally

### Requirement: Auth flow routes
The following public routes SHALL exist: `/auth/select`, `/auth/create`, `/auth/recover`, `/auth/password`, `/auth/success`, `/auth/derived`. Each route MUST render the corresponding page component from `@salmon/ui` or a thin wrapper.

#### Scenario: Create wallet flow
- **WHEN** a user navigates select → create → password → success → derived
- **THEN** each step renders the correct page and navigation works forward and backward

### Requirement: Main wallet routes
The following protected routes SHALL exist: `/home` (with tabs for home/collectibles/swap), `/token/:id`, `/nft/:mint`, `/nft/all`, `/activity`, `/send`.

#### Scenario: Token detail navigation
- **WHEN** a user clicks a token in the token list on `/home`
- **THEN** the app navigates to `/token/:id` showing the token detail page

### Requirement: Settings routes
The following protected routes SHALL exist: `/settings`, `/settings/backup`, `/settings/security`, `/settings/private-key`, `/settings/about`, `/settings/explorer`, `/settings/language`, `/settings/currency`, `/settings/trusted-apps`, `/settings/address-book`, `/settings/accounts`.

#### Scenario: Settings navigation
- **WHEN** a user clicks Settings on the home page
- **THEN** the app navigates to `/settings` showing the settings page as a full page (not a sheet/dialog)

#### Scenario: Settings sub-pages
- **WHEN** a user clicks "Backup" in settings
- **THEN** the app navigates to `/settings/backup` with a back button to `/settings`

### Requirement: Lock route
A `/lock` route SHALL exist that renders the `LockPage` component. After successful unlock, it MUST redirect to `/home`.

#### Scenario: Unlock redirects to home
- **WHEN** a user enters correct password on the lock page
- **THEN** the wallet unlocks and navigates to `/home`

### Requirement: Inactivity auto-lock
The web app SHALL use `useInactivityTimeout` from `@salmon/shared` with a 5-minute timeout. On timeout, it MUST lock the wallet and redirect to `/lock`.

#### Scenario: Auto-lock after inactivity
- **WHEN** a user is inactive for 5 minutes on any protected route
- **THEN** the wallet locks and the user sees the lock screen

### Requirement: Root redirect
The root path `/` SHALL redirect to `/home` if the wallet is unlocked, `/lock` if locked, or `/auth/select` if no wallet exists.

#### Scenario: Root redirect based on state
- **WHEN** a user visits `/`
- **THEN** they are redirected to the appropriate page based on wallet state
