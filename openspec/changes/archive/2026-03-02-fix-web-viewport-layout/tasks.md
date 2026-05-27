## 1. WalletLayout (packages/ui)

- [x] 1.1 In `packages/ui/src/layouts/WalletLayout.tsx`, change Outer from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 1.2 In `packages/ui/src/layouts/WalletLayout.tsx`, change Inner from `minHeight: '100vh'` to `height: '100%'`

## 2. Auth Screens (apps/web)

- [x] 2.1 In `apps/web/src/pages/auth/SelectPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 2.2 In `apps/web/src/pages/auth/CreatePage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`. Add `overflowY: 'auto'` and `minHeight: 0` to CenterContent so seed grid and validation inputs scroll internally.
- [x] 2.3 In `apps/web/src/pages/auth/RecoverPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 2.4 In `apps/web/src/pages/auth/PasswordPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 2.5 In `apps/web/src/pages/auth/SuccessPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 2.6 In `apps/web/src/pages/auth/DerivedAccountsPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`

## 3. Lock Screen (apps/web)

- [x] 3.1 In `apps/web/src/pages/lock/LockPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`

## 4. dApp Approval Screens (apps/web)

- [x] 4.1 In `apps/web/src/pages/dapp/ConnectApprovalPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 4.2 In `apps/web/src/pages/dapp/SignMessageApprovalPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`
- [x] 4.3 In `apps/web/src/pages/dapp/SignTransactionApprovalPage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'` and add `overflow: 'hidden'`

## 5. Home Screen (apps/web)

- [x] 5.1 In `apps/web/src/pages/home/HomePage.tsx`, change Container from `minHeight: '100vh'` to `height: '100vh'`

## 6. Typecheck

- [x] 6.1 Run `pnpm turbo run typecheck --filter=@salmon/ui --filter=@salmon/web` to verify no type errors
