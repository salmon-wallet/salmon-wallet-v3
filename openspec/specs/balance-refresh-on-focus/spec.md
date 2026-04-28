# balance-refresh-on-focus Specification

## Purpose

Define when and how wallet balances refresh in response to user-visible state changes. The extension calls `refresh()` after successful sends and dApp transaction/message approvals (but not after deny or connect). Both mobile and extension auto-refresh on app/tab focus, gated by a 60-second cache TTL. The extension exposes a manual refresh button in `WalletHeader`; mobile keeps pull-to-refresh. The shared `useRefreshOnFocus` hook is implemented via the `.native.ts` / `.web.ts` split.

## Requirements

### Requirement: Extension refreshes balance after successful send
The extension SHALL call the balance `refresh()` function after a successful token transfer, matching mobile's existing behavior. This applies to both regular token sends via `SendPage` and NFT sends via `NftSendDialog`.

#### Scenario: User sends tokens on extension
- **WHEN** user completes a token send on the extension and the transaction succeeds
- **THEN** the system SHALL call `refresh()` to fetch updated balance before navigating back to the home page

#### Scenario: User sends NFT on extension
- **WHEN** user completes an NFT send on the extension and the transaction succeeds
- **THEN** the system SHALL call `refresh()` to fetch updated balance before closing the send dialog

### Requirement: Extension refreshes balance after dApp transaction approval
The extension SHALL call the balance `refresh()` function after the user approves a dApp transaction or message signing request, so that the token list and balance update immediately. This applies to `DAppTransactionApprovalPage` (signTransaction, signAllTransactions, signAndSendTransaction) and `DAppSignMessageApprovalPage` (sign). Denying a request SHALL NOT trigger a refresh. Connect approvals (`DAppConnectPage`) SHALL NOT trigger a refresh.

#### Scenario: User approves a dApp transaction in the side panel
- **WHEN** user approves a transaction request (signTransaction, signAllTransactions, or signAndSendTransaction) from a dApp in the extension side panel
- **AND** the transaction is successfully signed or sent
- **THEN** the system SHALL call `refresh()` to fetch updated balance, displaying skeletons on the balance card and token list

#### Scenario: User approves a dApp message signing in the side panel
- **WHEN** user approves a message signing request (sign) from a dApp in the extension side panel
- **AND** the message is successfully signed
- **THEN** the system SHALL call `refresh()` to fetch updated balance

#### Scenario: User denies a dApp request
- **WHEN** user denies any dApp transaction or message signing request
- **THEN** the system SHALL NOT trigger a balance refresh

#### Scenario: Transaction approval fails with error
- **WHEN** user approves a dApp transaction but the signing or sending fails
- **THEN** the system SHALL NOT trigger a balance refresh

#### Scenario: User approves a dApp transaction in the popup fallback
- **WHEN** the side panel is not available and the approval is shown in a popup window
- **AND** user approves the transaction
- **THEN** the popup SHALL close via `window.close()` as before (no refresh signal needed — the side panel or popup will refresh on next open via `useRefreshOnFocus`)

#### Scenario: User approves a dApp connect request
- **WHEN** user approves a dApp connect request
- **THEN** the system SHALL NOT trigger a balance refresh (connecting does not change on-chain state)

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
