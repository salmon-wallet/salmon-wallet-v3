## Why

The Bitcoin transaction history is broken across all platforms (mobile, extension, web). The `fetchBitcoinAccountRecentTransactions` DI adapter in `packages/shared/src/api/services/bitcoin.ts` returns the raw backend response directly typed as `AccountTransactionListResponse`, but the backend (Ubiquity API) returns `{ data: [...], meta: { nextPageToken } }` while the type expects `{ items: [...], nextPageToken }`. This causes `response.items` to be `undefined`, crashing with `Cannot read properties of undefined (reading 'map')` at `useTransactions.ts:179`.

## What Changes

The `fetchBitcoinAccountRecentTransactions` function will transform the backend response shape (`data` + `meta.nextPageToken`) into the `AccountTransactionListResponse` shape (`items` + `nextPageToken`) expected by the `useTransactions` hook. This is the same pattern needed for any non-Solana chain using the Ubiquity backend.

## Capabilities

### New Capabilities

_None — this is a bug fix, not a new capability._

### Modified Capabilities

- `web-activity`: Bitcoin transactions will now load correctly via the existing `useTransactions` hook and `AccountTransactionListResponse` type.

## Impact

- **Affected code**: `packages/shared/src/api/services/bitcoin.ts` — `fetchBitcoinAccountRecentTransactions` function only
- **Platforms**: All (mobile, extension, web) — they all consume the shared hook via `BitcoinAccount.getRecentTransactions()`
- **Risk**: Very low — single function change, no type modifications needed, Solana path is unaffected
