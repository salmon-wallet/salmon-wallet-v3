## Why

The web app's wallet-standard registration in `SalmonWalletProvider.tsx` uses the wrong protocol: it dispatches `wallet-standard:app-ready` (the event apps use to discover wallets) instead of `wallet-standard:register-wallet` (the event wallets use to register themselves). This causes 6 `TypeError: cb is not a function` errors on every page load because browser wallet extensions (Phantom, Backpack, OKX, etc.) respond to `app-ready` by calling `register(walletObject)`, but the implementation treats the argument as a callback function. The extension app uses `salmon-wallet-standard` package which implements this correctly — the web app should follow the same pattern.

## What Changes

- Fix the wallet-standard event protocol in `apps/web/src/providers/SalmonWalletProvider.tsx`:
  - Dispatch `wallet-standard:register-wallet` instead of `wallet-standard:app-ready`
  - Listen for `wallet-standard:app-ready` events from dApps that load after the wallet
  - Use the correct callback pattern: `({ register }) => register(wallet)` instead of `(cb) => cb(wallet)`
- The wallet object's internal API (connect/sign via BroadcastChannel popups) remains unchanged — only the registration mechanism is fixed
- No changes to extension or mobile apps

## Capabilities

### New Capabilities

_(none — this is a bugfix to an existing capability)_

### Modified Capabilities

_(no spec-level requirement changes — the wallet registration was always intended to follow wallet-standard protocol; the implementation was simply incorrect)_

## Impact

- **Affected code**: `apps/web/src/providers/SalmonWalletProvider.tsx` only
- **Extension**: No changes — already uses `salmon-wallet-standard` correctly via `injected.ts`
- **Mobile**: No impact — no wallet-standard registration exists in mobile
- **Dependencies**: No new dependencies needed — the fix is a protocol correction in the existing custom implementation
- **Risk**: Low — changes only the event dispatch/listen mechanism, not the wallet's internal connect/sign logic
