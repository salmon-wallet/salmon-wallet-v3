## 1. Extend onDismiss signature in approval pages

- [x] 1.1 In `apps/extension/src/pages/dapp/DAppTransactionApprovalPage.tsx`: change `onDismiss: () => void` to `onDismiss: (approved: boolean) => void` in the Props interface. Update `handleDeny` to call `onDismiss(false)`. Update `handleApprove` to call `onDismiss(true)` on success and `onDismiss(false)` on error.
- [x] 1.2 In `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx`: same changes as 1.1 — change Props type, `handleDeny` calls `onDismiss(false)`, `handleApprove` calls `onDismiss(true)` on success and `onDismiss(false)` on error.

## 2. Add refresh signal in App.tsx

- [x] 2.1 In `apps/extension/src/entrypoints/popup/App.tsx`: add `dappRefreshKey` state (`useState(0)`). Create `dismissApprovalWithRefresh` callback that calls `dismissApproval()` and increments `dappRefreshKey` when `approved` is `true`.
- [x] 2.2 Pass `dismissApprovalWithRefresh` as `onDismiss` to `DAppTransactionApprovalPage` and `DAppSignMessageApprovalPage`. Keep `dismissApproval` (no boolean) for `DAppConnectPage`.
- [x] 2.3 Pass `refreshKey={dappRefreshKey}` prop to `<HomePage />`.

## 3. Consume refresh signal in HomePage

- [x] 3.1 In `apps/extension/src/pages/home/HomePage.tsx`: add `refreshKey?: number` to the `HomePageProps` interface. Add a `useEffect` that calls `refresh()` when `refreshKey` changes from its initial value (skip `0`). Place it after the existing `useRefreshOnFocus` hook call.

## 4. Verify

- [x] 4.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/extension`
