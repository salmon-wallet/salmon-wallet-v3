## Tasks

### Phase 1: Pre-flight check
- [x] 1.1 Search mobile/extension/web for `error.message` or `error.stack` usage on useBalance/useToken errors to identify breaking consumer patterns before changing Error → string

### Phase 2: Tier A — Mutation hooks (add isError)
- [x] 2.1 `useBridge.ts`: Add `isError: boolean` (derived) to `UseBridgeResult` interface and return object
- [x] 2.2 `useSwap.ts`: Add `isError: boolean` (derived) to `UseSwapResult` interface and return object
- [x] 2.3 `useSendTransaction.ts`: Add `isError: boolean` (derived) to `UseSendTransactionResult` interface and return object
- [x] 2.4 `useNftTransfer.ts`: Add `isError: boolean` (derived) to `UseNftTransferResult` interface and return object
- [x] 2.5 `useAccounts.ts`: Add `error: string | null` and `isError: boolean` to `UseAccountsState`. Add `resetError: () => void` to `UseAccountsActions`. Surface errors from try/catch blocks that currently only console.error.

### Phase 3: Tier B — Read hooks (add/normalize error)
- [x] 3.1 `useBalance.ts`: Change `error` from `Error | null` to `string | null` (store `err.message`). Add `isError: boolean` to `UseBalanceResult`.
- [x] 3.2 `useToken.ts`: Change `error` from `Error | null` to `string | null` (store `err.message`). Add `isError: boolean` to `UseTokenResult`.
- [x] 3.3 `useTransactions.ts`: Add `isError: boolean` to `UseTransactionsResult` (error already exposed as string).
- [x] 3.4 `useMultiChainTokens.ts`: Change `errors` values from `Error | null` to `string | null`. Add `hasErrors: boolean` to `UseMultiChainTokensResult`.
- [x] 3.5 `useAddressbook.ts`: Add `error: string | null` and `isError: boolean` to `UseAddressbookState`. Surface errors from storage load.
- [x] 3.6 `useAvatarNfts.ts`: Add `error: string | null` and `isError: boolean` to `UseAvatarNftsResult`. Surface errors from NFT fetch.
- [x] 3.7 `useTokenSearch.ts`: Add `error: string | null` and `isError: boolean` to `UseTokenSearchResult`. Surface errors from search API.

### Phase 4: Barrel exports
- [x] 4.1 Update `packages/shared/src/hooks/index.ts` to export any new types added in phases 2-3

### Phase 5: Consumer fixes
- [x] 5.1 Fix any consumer code broken by Error → string change (found in task 1.1)

### Phase 6: Verify
- [x] 6.1 Run `pnpm turbo run typecheck` — all packages pass
- [x] 6.2 Run `pnpm turbo run lint` — all packages pass
