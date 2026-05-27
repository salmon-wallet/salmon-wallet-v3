## Why

React throws a "duplicate key" console warning on the Transaction History page when loading more transactions via pagination. The Solana cursor-based pagination API can return boundary transactions that overlap between pages, and the `useTransactions` hook concatenates new pages without deduplicating by transaction ID.

## What Changes

- Add deduplication logic in `useTransactions.ts` when appending paginated results, filtering out transactions whose `id` already exists in the current state.

## Capabilities

### New Capabilities
- `transaction-deduplication`: Ensures transaction lists never contain duplicate entries when concatenating paginated results.

### Modified Capabilities
<!-- None — no existing specs require requirement-level changes -->

## Impact

- **packages/shared**: `src/hooks/useTransactions.ts` — the `loadMore` append logic at line 186
- **All apps** (mobile, extension, web): All consume `useTransactions`, so all benefit from this fix automatically
- No API changes, no new dependencies
