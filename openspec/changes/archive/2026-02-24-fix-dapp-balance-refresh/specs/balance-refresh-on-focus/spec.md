## ADDED Requirements

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
