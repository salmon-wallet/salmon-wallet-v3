## Why

The Trusted Apps feature in v3 is incomplete compared to v2. dApps that call `signMessage` hang indefinitely (no approval UI exists), the extension's Trusted Apps settings page is a stub (no way to view/revoke trusted apps), dApp metadata (name, icon) is never fetched during connection approval, the `onlyIfTrusted` eager-connect pattern is ignored, and the background script uses incorrect TypeScript types. These gaps make the wallet unusable with most Solana dApps (Jupiter, Raydium, etc.).

## What Changes

- Add a `DAppSignMessageApprovalPage` for the `sign` method and wire it into the extension popup router, so dApps calling `signMessage()` get a proper approval UI with message preview and signing logic
- Implement the extension `TrustedAppsPage` using the existing `TrustedAppsSelector` component, so users can view and revoke trusted apps from settings
- Fetch dApp metadata (name, icon) via the existing `dapp.ts` service during connection approval and pass it to `addTrustedApp`
- Implement `onlyIfTrusted` support in `background.ts`: when a dApp connects with `onlyIfTrusted: true` and is not trusted, reject silently instead of opening the popup
- Fix the `StorageData.trustedApps` type in `background.ts` from `Record<string, Record<string, boolean>>` to `Record<string, Record<string, { name?: string; icon?: string }>>`

## Capabilities

### New Capabilities
- `dapp-sign-message`: Approval UI and signing logic for the `sign` (signMessage) method in the extension popup, including message decoding, display, and ed25519 signature creation

### Modified Capabilities
- `security-settings`: The Trusted Apps settings page in the extension needs to be implemented (currently a stub) using the existing `TrustedAppsSelector` component and wired to the accounts context

## Impact

- **`apps/extension`**: New page `DAppSignMessageApprovalPage`, updated popup router (`App.tsx`), updated `background.ts` (onlyIfTrusted + types), implemented `TrustedAppsPage`, updated `DAppConnectPage` (metadata fetch)
- **`packages/shared`**: No new shared code needed — `dapp.ts` service, `TrustedApp` types, and `addTrustedApp` action already exist
- **`apps/mobile`**: No changes — mobile trusted apps UI already works
- **Dependencies**: `tweetnacl` or `@noble/ed25519` needed for message signing (check if already available via `@solana/web3.js`)
