## 1. Extension lint fixes

- [ ] 1.1 In `apps/extension/src/components/NftDetailPage/NftDetailPage.tsx`, add `copiedField` to the `useCallback` deps at line 382 (fixes both the `preserve-manual-memoization` error and `exhaustive-deps` warning)
- [ ] 1.2 In `apps/extension/src/pages/dapp/DAppSignMessageApprovalPage.tsx`, add `// eslint-disable-next-line no-control-regex` before line 62 (intentional control char regex)
- [ ] 1.3 In `apps/extension/src/pages/home/HomePage.tsx` line 337, rename `onAddAccount` to `_onAddAccount` in destructuring
- [ ] 1.4 In `apps/extension/src/pages/home/HomePage.tsx` line 769, prefix unused `index` callback param with `_`
- [ ] 1.5 In `apps/extension/src/pages/home/HomePage.tsx` line 798, remove `activeBlockchainIndex` from useMemo deps
- [ ] 1.6 In `apps/extension/src/pages/settings/AccountEditPage.tsx` line 11, remove unused `List` import
- [ ] 1.7 In `apps/extension/src/pages/settings/AddressAddPage.tsx` line 93, rename `activeNetworkName` to `_activeNetworkName` in destructuring
- [ ] 1.8 In `apps/extension/src/pages/settings/AddressEditPage.tsx` line 93, rename `activeBlockchain` to `_activeBlockchain` in destructuring

## 2. Mobile lint fixes

- [ ] 2.1 In `apps/mobile/app/(app)/(tabs)/index.tsx` line 617, prefix `explorerUrl` with `_`
- [ ] 2.2 In `apps/mobile/app/(app)/(tabs)/index.tsx` line 674, prefix unused `blockchain` callback param with `_`
- [ ] 2.3 In `apps/mobile/app/(app)/(tabs)/settings/security.tsx` line 17, remove `storeKeyForBiometric` from destructuring
- [ ] 2.4 In `apps/mobile/src/components/SendSheet/SendSheet.tsx`, move `handleSuccessContinue` (line 136) before the `useEffect` that references it (line 88), and add `handleSuccessContinue` to the useEffect deps at line 108
- [ ] 2.5 In `apps/mobile/src/components/SendSheet/StepAddressAmount.tsx` line 59, rename `contactsLoading` to `_contactsLoading` in destructuring
- [ ] 2.6 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx` line 1, remove unused `useMemo` from import
- [ ] 2.7 In `apps/mobile/src/components/AddressBookAdd/AddressBookAdd.tsx` line 32, rename `activeNetworkName` to `_activeNetworkName` in destructuring
- [ ] 2.8 In `apps/mobile/src/components/AddressBookEdit/AddressBookEdit.tsx` line 32, rename `activeBlockchain` to `_activeBlockchain` in destructuring

## 3. Verify

- [ ] 3.1 Run `pnpm turbo run typecheck` and confirm zero errors
- [ ] 3.2 Run `pnpm turbo run lint` and confirm zero errors across all packages
