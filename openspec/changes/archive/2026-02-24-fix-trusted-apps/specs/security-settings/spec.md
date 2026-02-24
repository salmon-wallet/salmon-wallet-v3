## ADDED Requirements

### Requirement: Extension TrustedAppsPage implementation
The extension `TrustedAppsPage` SHALL render the existing `TrustedAppsSelector` component connected to `useAccountsContext()` state. It SHALL display all trusted apps for the current network and allow the user to revoke any app. This page is used in the standalone popup context (separate from the side panel where it already works via `HomePage`).

**Package:** `apps/extension`

#### Scenario: User views trusted apps in popup settings
- **WHEN** user navigates to the Trusted Apps page in the popup
- **THEN** the system renders `TrustedAppsSelector` with `activeTrustedApps` mapped to `TrustedAppItem[]`
- **THEN** each trusted app shows its name (or domain if no name), icon, and a revoke button

#### Scenario: User revokes a trusted app
- **WHEN** user clicks the revoke button on a trusted app
- **THEN** the system calls `removeTrustedApp(domain)` from the accounts context
- **THEN** the app disappears from the list

#### Scenario: No trusted apps exist
- **WHEN** the trusted apps list for the current network is empty
- **THEN** the system shows an empty state message via the `TrustedAppsSelector` component
