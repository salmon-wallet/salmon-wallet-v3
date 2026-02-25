## Why

ESLint reports 9 issues in `@salmon/extension` (2 errors, 7 warnings) and 9 issues in `@salmon/mobile` (1 error, 8 warnings). These block CI lint checks.

## What Changes

### Extension (9 issues)
- Fix `react-hooks/preserve-manual-memoization` error in NftDetailPage by adding missing `copiedField` dep
- Suppress `no-control-regex` false positive in DAppSignMessageApprovalPage with eslint-disable comment
- Prefix unused `onAddAccount` param with `_` in HomePage
- Prefix unused `index` callback arg with `_` in HomePage
- Remove unnecessary `activeBlockchainIndex` from useMemo deps in HomePage
- Remove unused `List` import in AccountEditPage
- Prefix unused `activeNetworkName` with `_` in AddressAddPage
- Prefix unused `activeBlockchain` with `_` in AddressEditPage

### Mobile (9 issues)
- Prefix unused `explorerUrl` with `_` in index.tsx
- Prefix unused `blockchain` callback arg with `_` in index.tsx
- Remove unused `storeKeyForBiometric` from destructuring in security.tsx
- Prefix unused `activeNetworkName` with `_` in AddressBookAdd
- Prefix unused `activeBlockchain` with `_` in AddressBookEdit
- Fix `react-compiler/cannot-access-before-declaration` error in SendSheet by reordering `handleSuccessContinue` before the `useEffect` that references it
- Add `handleSuccessContinue` to useEffect deps in SendSheet
- Prefix unused `contactsLoading` with `_` in StepAddressAmount
- Remove unused `useMemo` import in SwapScreen

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — implementation-only lint fixes)

## Impact

- `apps/extension/src/` — 6 files
- `apps/mobile/` — 7 files
- No shared logic changes
