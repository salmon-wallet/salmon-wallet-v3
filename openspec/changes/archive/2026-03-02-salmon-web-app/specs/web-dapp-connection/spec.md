## ADDED Requirements

### Requirement: Salmon registers as a wallet-standard wallet
The web app SHALL register Salmon as a discoverable wallet using the `@wallet-standard/base` `registerWallet` API. The registration MUST expose the wallet name "Salmon", an icon, and supported chains (`solana:mainnet`, `solana:devnet`).

#### Scenario: dApp discovers Salmon
- **WHEN** a dApp using `@solana/wallet-adapter` scans for available wallets
- **THEN** "Salmon" appears in the wallet list if the user has the Salmon web app open

### Requirement: Wallet-standard features implemented
The registered wallet SHALL implement the following wallet-standard features: `standard:connect`, `standard:disconnect`, `standard:events`, `solana:signTransaction`, `solana:signMessage`, and `solana:signAndSendTransaction`.

#### Scenario: Connect feature
- **WHEN** a dApp calls the `standard:connect` feature
- **THEN** the Salmon web app opens an approval popup at `/dapp/connect`
- **THEN** after user approval, the dApp receives the wallet's public key

#### Scenario: Sign transaction feature
- **WHEN** a dApp calls `solana:signTransaction` with a transaction
- **THEN** the Salmon web app opens an approval popup at `/dapp/sign-transaction`
- **THEN** after user approval, the dApp receives the signed transaction

#### Scenario: Sign message feature
- **WHEN** a dApp calls `solana:signMessage` with a message
- **THEN** the Salmon web app opens an approval popup at `/dapp/sign-message`
- **THEN** after user approval, the dApp receives the signature

### Requirement: Popup-based approval flow
dApp approval requests SHALL open a popup window pointing to the Salmon web app's dApp approval route. The popup MUST receive the request parameters via URL search params or hash params.

#### Scenario: Popup opens for approval
- **WHEN** a dApp initiates a connect/sign/transaction request
- **THEN** a popup window opens with the Salmon web app's approval UI
- **THEN** the popup is sized appropriately (e.g., 420x600)

#### Scenario: Popup blocked by browser
- **WHEN** the browser blocks the popup
- **THEN** the wallet MUST fall back to a redirect-based flow or notify the user

### Requirement: Cross-window communication via BroadcastChannel
Communication between the dApp tab and the approval popup SHALL use `BroadcastChannel` API. The channel name MUST include a unique request ID to prevent cross-talk between concurrent requests.

#### Scenario: Approval response sent back
- **WHEN** the user approves a dApp request in the popup
- **THEN** the popup sends the result (public key, signed tx, or signature) via BroadcastChannel
- **THEN** the dApp tab receives the result and the popup closes

#### Scenario: User denies request
- **WHEN** the user clicks "Deny" in the approval popup
- **THEN** the popup sends a rejection via BroadcastChannel
- **THEN** the dApp receives an error

#### Scenario: Popup closed without action
- **WHEN** the user closes the popup without approving or denying
- **THEN** the dApp MUST receive a timeout or rejection after 30 seconds

### Requirement: dApp approval routes
The web app SHALL have the following routes for dApp approvals: `/dapp/connect`, `/dapp/sign-message`, `/dapp/sign-transaction`. Each route MUST validate the origin parameter and display the request details for user review.

#### Scenario: Connect approval page
- **WHEN** the popup opens at `/dapp/connect?origin=https://jupiter.ag&requestId=abc123`
- **THEN** it shows the requesting dApp origin, the wallet address, and Approve/Deny buttons

#### Scenario: Transaction approval page
- **WHEN** the popup opens at `/dapp/sign-transaction`
- **THEN** it shows transaction details (instructions, fee payer, estimated fee) and Approve/Deny buttons

### Requirement: Origin validation
All dApp approval pages SHALL validate the `origin` parameter. The origin MUST be a valid HTTPS URL. Origins from the trusted apps list (stored in `@salmon/shared` storage) MAY skip the approval step for `connect` requests.

#### Scenario: Trusted app auto-connects
- **WHEN** a dApp from the trusted apps list requests `connect`
- **THEN** the connection is approved automatically without showing the popup

#### Scenario: Unknown origin shows approval
- **WHEN** a dApp from an unknown origin requests `connect`
- **THEN** the full approval UI is shown with the origin prominently displayed

### Requirement: Wallet only active when web app is open
The wallet-standard registration SHALL only be active while the Salmon web app is open in a browser tab. The wallet MUST NOT persist or be discoverable when the tab is closed.

#### Scenario: Wallet disappears on tab close
- **WHEN** the user closes the Salmon web app tab
- **THEN** dApps can no longer discover "Salmon" in wallet-standard wallets
