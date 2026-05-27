## Why

All web app screens use `minHeight: '100vh'` instead of `height: '100vh'` in their root containers, which allows content to overflow the viewport and produce unwanted page-level scrolling. Screens like Welcome, Create, Recover, Password, Lock, and dApp approval pages should be viewport-locked (no scroll). The `WalletLayout` wrapper also uses `minHeight: '100vh'` on both its Outer and Inner containers, compounding the issue.

## What Changes

- **WalletLayout** (`packages/ui/src/layouts/WalletLayout.tsx`): Change both Outer and Inner from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: hidden` on Outer to prevent page-level scroll.
- **Auth screens** (`apps/web/src/pages/auth/`): Change `minHeight: '100vh'` → `height: '100vh'` + `overflow: hidden` on Container for:
  - `SelectPage` (Welcome)
  - `CreatePage` (Backup / Seed / Verify)
  - `RecoverPage` (Paste Seed)
  - `PasswordPage` (Choose Password)
  - `SuccessPage` (Account Created)
  - `DerivedAccountsPage` (Derived Accounts)
- **Lock screen** (`apps/web/src/pages/lock/LockPage.tsx`): Same fix — `height: '100vh'` + `overflow: hidden`.
- **dApp approval screens** (`apps/web/src/pages/dapp/`): Same fix for:
  - `ConnectApprovalPage`
  - `SignMessageApprovalPage`
  - `SignTransactionApprovalPage`
- **HomePage** (`apps/web/src/pages/home/HomePage.tsx`): Change Container from `minHeight: '100vh'` → `height: '100vh'` (Main already has `overflow: hidden` and TokenSection has `overflowY: auto`, so internal scroll is preserved).
- **SettingsPage**: Keep `fullHeight={false}` on PageShell — this is intentional since Settings has a variable-length list that may need scroll.
- For pages with variable-height content (CreatePage seed grid, DerivedAccountsPage list, RecoverPage textarea), ensure the scrollable section uses `overflowY: 'auto'` + `minHeight: 0` within the flex layout so internal scroll works while the page stays viewport-locked.

## Capabilities

### New Capabilities
- `web-viewport-layout`: Constraint that all web app screens must be viewport-locked (`height: 100vh`, `overflow: hidden`) with internal scroll only where explicitly needed (token lists, derived account lists, settings).

### Modified Capabilities

## Impact

- **packages/ui**: `WalletLayout.tsx` — affects all web routes wrapped by this layout.
- **apps/web**: 11 page components across auth, lock, dapp, and home directories.
- No API, dependency, or shared logic changes. Pure CSS/layout fix scoped to web app.
- Extension is unaffected — it uses the same `PageShell` but its own page components.
- Mobile is unaffected — uses React Native, not DOM layouts.
