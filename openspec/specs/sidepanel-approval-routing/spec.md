# sidepanel-approval-routing Specification

## Purpose
TBD - created by archiving change fix-sidepanel-approval-routing. Update Purpose after archive.
## Requirements
### Requirement: Side panel port tracking
The background service worker SHALL track whether the side panel is open by listening for a persistent port connection named `salmon_sidepanel`. The side panel SHALL connect this port on mount. The background SHALL set `sidePanelPort` to `null` when the port disconnects.

#### Scenario: Side panel opens and connects port
- **WHEN** the side panel mounts (`apps/extension/src/entrypoints/sidepanel/main.tsx`)
- **THEN** it SHALL call `chrome.runtime.connect({ name: 'salmon_sidepanel' })`
- **AND** the background's `sidePanelPort` reference SHALL be non-null

#### Scenario: Side panel closes
- **WHEN** the side panel is closed by the user
- **THEN** the port's `onDisconnect` fires
- **AND** the background's `sidePanelPort` reference SHALL be set to `null`

### Requirement: No duplicate approval display
The system SHALL NEVER show a dApp approval request in both the side panel and a popup window simultaneously. Exactly one surface SHALL display the approval.

#### Scenario: Side panel is open when approval arrives
- **WHEN** a dApp sends a signing/transaction/connect request
- **AND** `sidePanelPort` is connected (side panel is open)
- **THEN** the background SHALL write the request to `chrome.storage.session` key `salmon_pending_approval`
- **AND** the background SHALL NOT open a popup window

#### Scenario: Side panel is closed and method needs approval UI (non-connect)
- **WHEN** a dApp sends a `sign`, `signTransaction`, `signAllTransactions`, or `signAndSendTransaction` request
- **AND** `sidePanelPort` is null (side panel is not open)
- **THEN** the background SHALL call `chrome.sidePanel.open({ tabId })` as the first operation in the `onMessage` handler (before any `await`)
- **AND** write the request to `chrome.storage.session`
- **AND** if `sidePanel.open()` fails, fall back to `chrome.windows.create()` and remove the storage entry

#### Scenario: Side panel is closed and method is connect (not trusted)
- **WHEN** a dApp sends a `connect` request for a non-trusted origin
- **AND** `sidePanelPort` is null
- **THEN** the background SHALL fall back to `chrome.windows.create()` (popup window)
- **AND** SHALL NOT write to `chrome.storage.session`

### Requirement: Gesture chain preservation for sidePanel.open()
The `chrome.sidePanel.open()` call SHALL be the first async operation in the `onMessage` handler for `salmon_contentscript_background_channel` messages that always require approval UI. No `await`, callback, or `chrome.storage` operation SHALL precede it.

#### Scenario: signTransaction request with panel closed
- **WHEN** the `onMessage` handler receives a `signTransaction` message
- **AND** `sidePanelPort` is null
- **THEN** `chrome.sidePanel.open({ tabId: sender.tab.id })` SHALL be called before any `await` or async storage operation
- **AND** the `onMessage` listener SHALL NOT return a Promise (returns `true` for sendResponse keepalive)

### Requirement: Storage-based request queue
Pending approval requests SHALL be stored in `chrome.storage.session` under the key `salmon_pending_approval` as an array of `{ origin, request }` objects. The side panel SHALL process the first item in the queue and pop it on completion.

#### Scenario: New approval request written to storage
- **WHEN** the background writes a new approval to `salmon_pending_approval`
- **THEN** it SHALL append to the existing array (not overwrite)
- **AND** the side panel SHALL detect the change via `chrome.storage.onChanged` listener

#### Scenario: Side panel reads pending approval on mount
- **WHEN** the side panel's `App.tsx` mounts
- **THEN** it SHALL read `chrome.storage.session.get('salmon_pending_approval')`
- **AND** if the queue is non-empty, route the first item to the appropriate pending state

#### Scenario: Approval completed (approve or deny)
- **WHEN** the user approves or denies a request in a DApp approval page
- **THEN** `onDismiss` SHALL be called
- **AND** `onDismiss` SHALL remove the first item from the `salmon_pending_approval` queue
- **AND** if remaining items exist, the `onChanged` listener SHALL route the next one
- **AND** if queue is empty, the side panel SHALL return to HomePage

### Requirement: DApp pages use onDismiss instead of window.close()
All three DApp approval pages (`DAppConnectPage`, `DAppTransactionApprovalPage`, `DAppSignMessageApprovalPage`) SHALL accept an `onDismiss` prop and call it instead of `window.close()` after approving or denying a request.

#### Scenario: User approves connection in side panel
- **WHEN** the user clicks Approve on `DAppConnectPage` in the side panel
- **THEN** the page SHALL send the response to background via `salmon_extension_background_channel`
- **AND** call `onDismiss()` (which clears storage and resets state)
- **AND** SHALL NOT call `window.close()`

#### Scenario: User denies transaction in side panel
- **WHEN** the user clicks Deny on `DAppTransactionApprovalPage` in the side panel
- **THEN** the page SHALL send the rejection to background
- **AND** call `onDismiss()`
- **AND** SHALL NOT call `window.close()`

### Requirement: Auto-reject on timeout
The background SHALL auto-reject pending approval requests after 30 seconds if no response is received. The timed-out request SHALL be removed from the `salmon_pending_approval` queue.

#### Scenario: Side panel does not respond within 30 seconds
- **WHEN** 30 seconds elapse after writing an approval to storage
- **AND** the response handler for that request ID still exists
- **THEN** the background SHALL call the response handler with `{ error: 'Request timeout' }`
- **AND** remove the request from the `salmon_pending_approval` queue

