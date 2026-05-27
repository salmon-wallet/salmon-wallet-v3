## Context

The web app (`apps/web`) registers itself as a wallet-standard wallet so dApps can discover it. The current implementation in `apps/web/src/providers/SalmonWalletProvider.tsx` dispatches the wrong event (`wallet-standard:app-ready` instead of `wallet-standard:register-wallet`), causing TypeErrors when browser wallet extensions try to register with it.

The extension app (`apps/extension`) already handles this correctly via the `salmon-wallet-standard` npm package, which implements the full wallet-standard protocol in `register.ts`:
1. Dispatches `wallet-standard:register-wallet` event with a callback
2. Listens for `wallet-standard:app-ready` events for late-arriving apps

The web wallet's internal communication (BroadcastChannel-based popup approval flow) is unrelated to the registration bug and remains unchanged.

## Goals / Non-Goals

**Goals:**
- Eliminate the 6 `TypeError: cb is not a function` console errors on web app load
- Follow the correct wallet-standard registration protocol (same as v2/extension)
- Keep the fix scoped to `apps/web/` — zero changes to extension, mobile, or shared packages

**Non-Goals:**
- Refactoring the web wallet to use the `salmon-wallet-standard` package directly (the web wallet has a fundamentally different communication model — BroadcastChannel popups vs extension content scripts — so it can't share the `SolanaProvider`/`Salmon` interface expected by that package)
- Implementing the full `@wallet-standard/base` `Wallet` interface (the web wallet's minimal object shape is sufficient for its popup-based approval flow)
- Fixing the `HydrateFallback` React Router warning (unrelated issue)

## Decisions

### 1. Inline protocol fix vs importing `salmon-wallet-standard`

**Decision**: Fix the protocol inline in `SalmonWalletProvider.tsx`.

**Why not import `salmon-wallet-standard`?** The package's `initialize()` expects a `Salmon` interface (from `window.ts`) — an EventEmitter with `connect(options?)`, `signTransaction(tx, network?)`, etc. The web wallet's object has a different shape: `connect(origin)`, `signMessage(origin, message)`, communication via BroadcastChannel. Adapting to the `Salmon` interface would require a shim layer with no benefit since the web wallet's popup flow is architecturally different from the extension's content-script flow.

**The fix**: Replicate the correct protocol from `salmon-wallet-standard/src/register.ts` directly:

```ts
// Current (broken):
const registerEvent = new CustomEvent('wallet-standard:app-ready', {
  detail: { register: (cb: (wallet: unknown) => void) => cb(wallet) },
});
window.dispatchEvent(registerEvent);

// Fixed:
const callback = ({ register }: { register: (wallet: unknown) => void }) => register(wallet);

// 1. Dispatch register-wallet event for apps already listening
window.dispatchEvent(
  new CustomEvent('wallet-standard:register-wallet', {
    detail: callback,
    bubbles: false,
    cancelable: false,
  })
);

// 2. Listen for app-ready events from apps that load later
window.addEventListener('wallet-standard:app-ready', (event) => {
  callback((event as CustomEvent).detail);
});
```

### 2. Keep the React component wrapper

**Decision**: Keep `SalmonWalletRegistrar` as a React component with `useEffect`.

The registration must happen once after mount, and the `useEffect` + module-level `registered` guard already handles this correctly. No need to change the component API or how it's used in `main.tsx`.

### 3. Cleanup of the `app-ready` listener

**Decision**: Add cleanup in the `useEffect` return to remove the `wallet-standard:app-ready` listener on unmount, preventing potential memory leaks in hot-reload scenarios during development.

## Risks / Trade-offs

- **[Low] Wallet object shape is non-standard**: The web wallet's minimal object (`name`, `icon`, `version`, `connect`, `signMessage`, `signTransaction`) doesn't implement the full `Wallet` interface from `@wallet-standard/base`. This is fine because the web wallet is the app itself, not a third-party wallet injecting into other pages. The registration primarily serves future dApp integration via the popup approval flow.
- **[Low] Other extensions still register**: After the fix, browser wallet extensions will no longer error — but they will still register themselves via the `wallet-standard:app-ready` listener if the web app dispatches it. Since the web app no longer dispatches `app-ready`, this is a non-issue. The extensions' own `register-wallet` events are ignored because the web app doesn't listen for them (it's a wallet, not a dApp host).
