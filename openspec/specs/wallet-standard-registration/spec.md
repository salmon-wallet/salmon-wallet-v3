# wallet-standard-registration Specification

## Purpose

Register the Salmon web app as a discoverable wallet via the wallet-standard event protocol. Registration SHALL dispatch `wallet-standard:register-wallet`, listen for `wallet-standard:app-ready` from late-arriving dApps, run only once across StrictMode mounts, and avoid impersonating a dApp host so that third-party wallet extensions (Phantom, Backpack, OKX, etc.) keep working without console errors.

## Requirements

### Requirement: Web wallet registers via wallet-standard protocol
The web app (`apps/web`) SHALL register itself as a discoverable wallet using the wallet-standard event protocol. Registration MUST dispatch a `wallet-standard:register-wallet` event and listen for `wallet-standard:app-ready` events from late-arriving dApps.

#### Scenario: Wallet registers on page load
- **WHEN** the web app mounts the `SalmonWalletRegistrar` component
- **THEN** it SHALL dispatch a `wallet-standard:register-wallet` CustomEvent with a `detail` callback that accepts `{ register }` and calls `register(wallet)`

#### Scenario: Late-arriving dApp discovers the wallet
- **WHEN** a dApp dispatches a `wallet-standard:app-ready` event after the wallet has already registered
- **THEN** the wallet SHALL respond by calling the dApp's `register` function with its wallet object

#### Scenario: Registration happens only once
- **WHEN** the `SalmonWalletRegistrar` component mounts multiple times (e.g. React StrictMode)
- **THEN** the registration logic SHALL execute only once (guarded by a module-level flag)

### Requirement: No interference with third-party wallet extensions
The web app's registration SHALL NOT cause errors in third-party wallet extensions (Phantom, Backpack, OKX, etc.) that are active in the same browser.

#### Scenario: Browser has wallet extensions installed
- **WHEN** the web app loads in a browser with wallet extensions installed
- **THEN** the console SHALL have zero `TypeError` errors originating from `SalmonWalletProvider.tsx`

#### Scenario: Web app does not impersonate a dApp host
- **WHEN** the web app registers itself as a wallet
- **THEN** it SHALL NOT dispatch `wallet-standard:app-ready` events (that event is for dApps, not wallets)
