## 1. Fix wallet-standard registration protocol

- [x] 1.1 In `apps/web/src/providers/SalmonWalletProvider.tsx`, replace the `registerSalmonWallet` function's event dispatch: change `wallet-standard:app-ready` CustomEvent to `wallet-standard:register-wallet` CustomEvent with `detail` set to a callback `({ register }) => register(wallet)` (matching `salmon-wallet-standard/src/register.ts` protocol)
- [x] 1.2 Add a `wallet-standard:app-ready` event listener inside `registerSalmonWallet` so the wallet responds to late-arriving dApps by calling their `register` function with the wallet object
- [x] 1.3 Remove the old `window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', ...))` call entirely — the web app must not dispatch `app-ready` events

## 2. Cleanup and guard

- [x] 2.1 Return a cleanup function from the `useEffect` in `SalmonWalletRegistrar` that removes the `wallet-standard:app-ready` event listener on unmount (prevents memory leaks during HMR)

## 3. Verification

- [x] 3.1 Run `pnpm turbo run typecheck --filter=@salmon/web` to confirm no type errors
- [x] 3.2 Run `pnpm web:dev`, open Chrome DevTools console, and verify zero `TypeError: cb is not a function` errors from `SalmonWalletProvider.tsx`
- [x] 3.3 Verify extension is unaffected: run `pnpm extension:dev` and confirm no regressions in wallet injection (`injected.ts` still uses `salmon-wallet-standard` independently)
