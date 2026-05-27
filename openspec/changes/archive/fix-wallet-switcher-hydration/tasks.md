## 1. Fix HTML nesting in WalletSwitcherSheet

- [x] 1.1 Add `component="span"` to `AccountName` styled component definition (line 71 of `packages/ui/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx`)
- [x] 1.2 Add `component="span"` to `AccountAddress` styled component definition (line 80 of `packages/ui/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx`)

## 2. Verify

- [x] 2.1 Run typecheck to confirm no type errors are introduced (`pnpm turbo run typecheck --filter=@salmon/ui`)
