## Approach

Minimal, surgical fixes for each lint issue. No behavior changes.

### Fix categories

1. **Unused vars/params** → prefix with `_` (destructuring rename for interface props) or remove
2. **Missing deps** → add to dependency array
3. **Unnecessary deps** → remove from dependency array
4. **Unused imports** → remove the import
5. **`no-control-regex` false positive** → eslint-disable-next-line (intentional regex for control chars)
6. **`react-compiler` error** → add missing dep to fix memoization preservation
7. **`cannot-access-before-declaration`** → reorder function declarations

## Files Changed

| File | Issues | Fix |
|------|--------|-----|
| `ext: NftDetailPage.tsx` | preserve-manual-memoization error, missing dep warning | Add `copiedField` to useCallback deps |
| `ext: DAppSignMessageApprovalPage.tsx` | no-control-regex error | eslint-disable (intentional) |
| `ext: HomePage.tsx` | 3 warnings (unused params, unnecessary dep) | Prefix `_`, remove dep |
| `ext: AccountEditPage.tsx` | unused import | Remove `List` import |
| `ext: AddressAddPage.tsx` | unused param | Prefix `_` |
| `ext: AddressEditPage.tsx` | unused param | Prefix `_` |
| `mobile: index.tsx` | 2 warnings (unused vars) | Prefix `_` |
| `mobile: security.tsx` | unused var | Remove from destructuring |
| `mobile: AddressBookAdd.tsx` | unused param | Prefix `_` |
| `mobile: AddressBookEdit.tsx` | unused param | Prefix `_` |
| `mobile: SendSheet.tsx` | 1 error + 1 warning | Reorder + add dep |
| `mobile: StepAddressAmount.tsx` | unused var | Prefix `_` |
| `mobile: SwapScreen.tsx` | unused import | Remove `useMemo` |
