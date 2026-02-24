## ADDED Requirements

### Requirement: Sign message approval page in extension popup
The system SHALL display a `DAppSignMessageApprovalPage` when a dApp requests message signing via the `sign` method. The page SHALL show the requesting origin, the message content, and Approve/Deny buttons. The page SHALL decode the message bytes as UTF-8 text for display; if the bytes are not valid UTF-8, the system SHALL display the hex representation instead.

**Package:** `apps/extension`

#### Scenario: dApp requests signMessage and user approves
- **WHEN** a dApp calls `signMessage()` which sends `method: 'sign'` with `params.data` (array of bytes)
- **THEN** the background service worker opens the popup with the sign request
- **WHEN** the popup parses the request with `method === 'sign'`
- **THEN** the system renders `DAppSignMessageApprovalPage` showing the origin, decoded message, and Approve/Deny buttons
- **WHEN** user clicks Approve
- **THEN** the system signs the message using `nacl.sign.detached(messageBytes, account.keyPair.secretKey)`
- **THEN** the system sends the response `{ result: { signature: <bs58-encoded>, publicKey: <address> }, id: <requestId> }` to the background via `chrome.runtime.sendMessage`
- **THEN** the popup window closes

#### Scenario: dApp requests signMessage and user denies
- **WHEN** user clicks Deny on the sign message approval page
- **THEN** the system sends `{ error: 'User rejected the request', id: <requestId> }` to the background
- **THEN** the popup window closes

#### Scenario: Message is valid UTF-8 text
- **WHEN** the message bytes decode successfully as UTF-8 without control characters
- **THEN** the system displays the decoded text string in the approval page

#### Scenario: Message is not valid UTF-8
- **WHEN** the message bytes cannot be decoded as valid UTF-8 text
- **THEN** the system displays the hex representation (prefixed with `0x`) of the bytes

### Requirement: Popup router handles sign method
The extension popup `App.tsx` SHALL route requests with `method === 'sign'` to the `DAppSignMessageApprovalPage`, in addition to the existing `connect`, `signTransaction`, `signAllTransactions`, and `signAndSendTransaction` routes.

**Package:** `apps/extension`

#### Scenario: Popup receives sign request
- **WHEN** the popup opens with a request where `method === 'sign'`
- **THEN** the system sets `pendingDAppSignMessageRequest` state with the origin and request
- **THEN** the system renders `DAppSignMessageApprovalPage` with the request data and active account

### Requirement: Fetch dApp metadata on connection approval
The system SHALL fetch dApp metadata (name, icon) from the Salmon API when displaying the connection approval page. On approve, the system SHALL pass the fetched metadata to `addTrustedApp(origin, { name, icon })`.

**Package:** `apps/extension`

#### Scenario: Metadata fetch succeeds before user approves
- **WHEN** `DAppConnectPage` mounts with an origin
- **THEN** the system calls `getMetadata(origin)` from `@salmon/shared`
- **WHEN** the API returns `{ name, icon }`
- **THEN** the system stores the metadata locally
- **WHEN** user clicks Approve
- **THEN** the system calls `addTrustedApp(origin, { name, icon })` with the fetched metadata

#### Scenario: Metadata fetch fails
- **WHEN** `getMetadata(origin)` throws or returns null
- **THEN** the system proceeds without metadata
- **WHEN** user clicks Approve
- **THEN** the system calls `addTrustedApp(origin)` without metadata (name and icon remain undefined)

### Requirement: Support onlyIfTrusted connect option
The background service worker SHALL read the `onlyIfTrusted` option from connect requests. When `onlyIfTrusted` is `true` and the origin is NOT in the trusted apps list for the current network, the system SHALL respond with an error instead of opening the popup.

**Package:** `apps/extension`

#### Scenario: Eager connect with trusted origin
- **WHEN** a dApp sends `connect` with `params.options.onlyIfTrusted === true`
- **WHEN** the origin IS in `trustedApps[networkId]`
- **THEN** the system auto-connects and responds with `{ method: 'connected', params: { publicKey } }` (existing behavior)

#### Scenario: Eager connect with untrusted origin
- **WHEN** a dApp sends `connect` with `params.options.onlyIfTrusted === true`
- **WHEN** the origin is NOT in `trustedApps[networkId]`
- **THEN** the system responds with `{ error: 'User not connected', id: <requestId> }` without opening a popup

#### Scenario: Normal connect (onlyIfTrusted not set)
- **WHEN** a dApp sends `connect` without `onlyIfTrusted` or with `onlyIfTrusted === false`
- **WHEN** the origin is NOT trusted
- **THEN** the system opens the popup for user approval (existing behavior)

### Requirement: Correct StorageData type in background
The `StorageData.trustedApps` type in `background.ts` SHALL match the actual stored data shape: `Record<string, Record<string, { name?: string; icon?: string }>>` instead of `Record<string, Record<string, boolean>>`.

**Package:** `apps/extension`

#### Scenario: TypeScript type matches runtime data
- **WHEN** background.ts reads `trustedApps` from chrome.storage.local
- **THEN** the parsed type SHALL be `Record<string, Record<string, { name?: string; icon?: string }>> | null`
