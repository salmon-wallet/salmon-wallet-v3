## 1. Add result normalizer to the hook

- [x] 1.1 In `packages/shared/src/hooks/useAddressValidation.ts`: add a `normalizeValidationResult` helper function that accepts the union of all three account validation return types (`ValidationResult | AddressValidationResult | EthereumAddressValidationResult`) and the account, and returns a `ValidationResult`. For `SolanaAccount` results, pass through unchanged (already `ValidationResult`). For `BitcoinAccount` results, map `code` (`'INVALID_ADDRESS'` -> `'invalid'`, `'VALID'` -> `'valid'`) to `ValidationResultCode`, map `addressType` to `'PUBLIC_KEY'`. For `EthereumAccount` results, map `code` similarly, map `addressType` `'ADDRESS'` -> `'PUBLIC_KEY'`, preserve `resolvedAddress` if present. Import the `AddressValidationResult` and `EthereumAddressValidationResult` types from the account modules.

## 2. Refactor hook signature

- [x] 2.1 In `packages/shared/src/hooks/useAddressValidation.ts`: change the second parameter from `connection: ChainConnection` to `account: BlockchainAccount | undefined`. Import `BlockchainAccount` from `../types/blockchain` and type guards (`isSolanaAccount`, `isBitcoinAccount`, `isEthereumAccount`) from `../utils/account`.
- [x] 2.2 Remove the `blockchain` field from `UseAddressValidationOptions`. The chain is now derived from the account via type guards inside `validateAddress`.
- [x] 2.3 Remove the `SolanaConnection`, `EthereumProvider`, and `ChainConnection` type aliases. Remove the imports of `validateSolanaAddress` from `../blockchain/solana` and `validateEthereumAddress` from `../blockchain/ethereum`.
- [x] 2.4 Rewrite the `validateAddress` callback: replace the `if (blockchain === 'solana') / else if (blockchain === 'ethereum') / else if (blockchain === 'bitcoin')` dispatch with a single `account.validateDestinationAccount(addressToValidate)` call, then pass the result through `normalizeValidationResult`. Guard early with `if (!account) { reset(); return; }`.
- [x] 2.5 Update the `useCallback` dependency array for `validateAddress` — replace `connection` and `options.blockchain` with `account`.
- [x] 2.6 Update the JSDoc example and `@param` annotations on the `useAddressValidation` function to reflect the new `account` parameter.
- [x] 2.7 Update the re-exports at the top of the file: remove the re-export of `BlockchainType` if it is no longer needed by the hook's public API.

## 3. Update `InputAddressPropsBase` shared type

- [x] 3.1 In `packages/shared/src/types/ui/input-address.ts`: remove the `blockchain?: BlockchainType` prop from `InputAddressPropsBase`. This prop is no longer needed since the hook derives the chain from the account.
- [x] 3.2 If `BlockchainType` is no longer imported anywhere in `input-address.ts`, remove the import.

## 4. Update callers — mobile InputAddress

- [x] 4.1 In `apps/mobile/src/components/InputAddress/InputAddress.tsx`: remove the entire `useEffect` block that resolves `connection` from `activeBlockchainAccount` and the `connection` state variable.
- [x] 4.2 Replace the `useAddressValidation(address, connection, { debounceMs, blockchain, onValidation })` call with `useAddressValidation(address, activeBlockchainAccount, { debounceMs: 500, onValidation })`.
- [x] 4.3 Remove the `blockchain` prop destructuring from the component props (it is no longer passed down to the hook). Remove the `blockchain = 'solana'` default and the `isSolanaAccount` import if no longer used elsewhere in the file.
- [x] 4.4 Update the `InputAddressProps` type in `apps/mobile/src/components/InputAddress/types.ts` if the removed `blockchain` prop causes type errors (it should be automatically removed since it comes from `InputAddressPropsBase`).

## 5. Update callers — extension InputAddress

- [x] 5.1 In `apps/extension/src/components/InputAddress/InputAddress.tsx`: remove the entire `useEffect` block that resolves `connection` from `activeBlockchainAccount` and the `connection` state variable.
- [x] 5.2 Replace the `useAddressValidation(address, connection, { debounceMs, blockchain, onValidation })` call with `useAddressValidation(address, activeBlockchainAccount, { debounceMs: 500, onValidation })`.
- [x] 5.3 Remove the `blockchain` prop destructuring from the component props. Remove the `isSolanaAccount` and `isEthereumAccount` imports if no longer used elsewhere in the file.
- [x] 5.4 Update the `InputAddressProps` type in `apps/extension/src/components/InputAddress/types.ts` if the removed `blockchain` prop causes type errors.

## 6. Update callers of InputAddress components

- [x] 6.1 Search for all call sites that pass a `blockchain` prop to `<InputAddress />` in both `apps/mobile/` and `apps/extension/`. Remove the `blockchain` prop from each call site since it is no longer accepted. (Fixed: AddressBookAdd, AddressBookEdit, NftSendSheet, AddressAddPage, AddressEditPage, NftSendDialog)

## 7. Shared barrel exports

- [x] 7.1 Verify that the `useAddressValidation` export in `packages/shared/src/hooks/index.ts` still works with the new signature. No changes should be needed unless the re-exported types changed. (Verified: names unchanged.)
- [x] 7.2 If `BlockchainType` was only re-exported via `useAddressValidation.ts` and is still needed by other consumers, ensure it remains exported from another barrel entry point. (Verified: exported from `types/blockchain.ts` → `types/index.ts`.)

## 8. Tests

- [x] 8.1 Search for any existing test files that import or mock `useAddressValidation`, `validateSolanaAddress`, or `validateEthereumAddress`. Update mocks to provide a mock `BlockchainAccount` with a `validateDestinationAccount` method instead of a mock connection. (No test files found.)
- [x] 8.2 If no test files exist for `useAddressValidation`, note this and skip (no new tests required for this refactor). (Skipped — no tests exist.)

## 9. Verification

- [x] 9.1 Run typecheck: `pnpm turbo run typecheck` — all 4 packages pass
- [x] 9.2 Run lint: `pnpm turbo run lint` — no new warnings/errors introduced (pre-existing SendSheet.tsx error remains)
- [x] 9.3 Run build: `pnpm turbo run build` — extension builds successfully
- [x] 9.4 Fix any errors found before marking the change as complete — fixed: additional callers (StepAddressAmount, RecipientAddressInput, AddressBook*, NftSend*) and unused `activeBlockchain` prefixed with `_`
