## ADDED Requirements

### Requirement: Extension refreshes balance after successful send
The extension SHALL call the balance `refresh()` function after a successful token transfer, matching mobile's existing behavior. This applies to both regular token sends via `SendPage` and NFT sends via `NftSendDialog`.

#### Scenario: User sends tokens on extension
- **WHEN** user completes a token send on the extension and the transaction succeeds
- **THEN** the system SHALL call `refresh()` to fetch updated balance before navigating back to the home page

#### Scenario: User sends NFT on extension
- **WHEN** user completes an NFT send on the extension and the transaction succeeds
- **THEN** the system SHALL call `refresh()` to fetch updated balance before closing the send dialog

### Requirement: Balance refreshes when app regains focus
The system SHALL automatically refresh the balance when the app regains focus (returns to foreground), but only if the cached balance data is stale (older than the cache TTL of 60 seconds).

#### Scenario: Mobile returns from background after cache expired
- **WHEN** the mobile app transitions from background to active state
- **AND** the last balance fetch was more than 60 seconds ago
- **THEN** the system SHALL call `refresh()` to fetch updated balance

#### Scenario: Mobile returns from background within cache window
- **WHEN** the mobile app transitions from background to active state
- **AND** the last balance fetch was less than 60 seconds ago
- **THEN** the system SHALL NOT trigger a balance refresh

#### Scenario: Extension tab becomes visible after cache expired
- **WHEN** the extension tab/popup becomes visible (via `visibilitychange` event)
- **AND** the last balance fetch was more than 60 seconds ago
- **THEN** the system SHALL call `refresh()` to fetch updated balance

#### Scenario: Extension tab becomes visible within cache window
- **WHEN** the extension tab/popup becomes visible (via `visibilitychange` event)
- **AND** the last balance fetch was less than 60 seconds ago
- **THEN** the system SHALL NOT trigger a balance refresh

#### Scenario: Hook disabled when account not ready
- **WHEN** the balance hook is in `skip` mode (no active account)
- **THEN** the focus listener SHALL NOT trigger any refresh

### Requirement: Extension provides manual refresh button
The extension SHALL display a refresh button in the `WalletHeader` component, next to the settings button, allowing users to manually trigger a balance refresh.

#### Scenario: Refresh button visible in extension header
- **WHEN** the extension home page is displayed
- **THEN** a refresh icon button SHALL be visible in the header action buttons area, to the left of the settings button

#### Scenario: User taps refresh button
- **WHEN** user clicks the refresh button in the extension header
- **THEN** the system SHALL call `refresh()` to fetch updated balance, bypassing the cache

#### Scenario: Refresh button shows loading state
- **WHEN** a balance refresh is in progress (`refreshing` is true)
- **THEN** the refresh icon SHALL display a spinning animation to indicate loading

#### Scenario: Mobile header unaffected
- **WHEN** the mobile home screen is displayed
- **THEN** the mobile `WalletHeader` SHALL NOT display a refresh button (mobile uses pull-to-refresh instead)

### Requirement: Shared hook uses platform-specific focus detection
The `useRefreshOnFocus` hook SHALL be implemented as platform-split files following the existing `.native.ts` / `.web.ts` pattern (consistent with `useRuntime`).

#### Scenario: Mobile build resolves native implementation
- **WHEN** the mobile app imports `useRefreshOnFocus`
- **THEN** the bundler SHALL resolve `useRefreshOnFocus.native.ts` which uses React Native `AppState`

#### Scenario: Extension build resolves web implementation
- **WHEN** the extension imports `useRefreshOnFocus`
- **THEN** the bundler SHALL resolve `useRefreshOnFocus.web.ts` which uses `document.visibilitychange`
