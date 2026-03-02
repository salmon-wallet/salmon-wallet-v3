## Context

The backend (Ubiquity API via `ubiquity-controller.js`) returns Bitcoin transaction lists in the shape `{ data: AccountTransaction[], meta: { nextPageToken } }`. The frontend DI adapter `fetchBitcoinAccountRecentTransactions` in `packages/shared/src/api/services/bitcoin.ts:278-297` types this directly as `AccountTransactionListResponse` (`{ items: AccountTransaction[], nextPageToken }`), causing `response.items` to be `undefined` and crashing `useTransactions.ts:179` with `.map()` on undefined.

The existing `get<T>()` helper from `api/client` unwraps the axios response but does NOT transform the data shape. Solana has its own separate path and is unaffected.

## Goals / Non-Goals

**Goals:**
- Fix `fetchBitcoinAccountRecentTransactions` to transform the backend response shape into `AccountTransactionListResponse`
- Ensure the fix works for all platforms (mobile, extension, web) via the shared package

**Non-Goals:**
- Changing the backend response format
- Modifying `useTransactions` hook logic
- Modifying `AccountTransactionListResponse` type
- Fixing Ethereum transactions (separate investigation if needed)

## Decisions

1. **Transform in the DI adapter** — The `fetchBitcoinAccountRecentTransactions` function is the correct place to map `data` → `items` and `meta.nextPageToken` → `nextPageToken`. This keeps the hook and type clean.
2. **Reuse existing types** — No new types needed. A local inline type for the raw backend response shape is sufficient.
3. **No changes to `useTransactions.ts`** — The hook's contract (`AccountTransactionListResponse`) is correct; the adapter was violating it.

## Risks / Trade-offs

- **Low risk**: Single function change in shared package, no type changes, no hook changes.
- **Ethereum may have the same issue**: The `fetchEthereumAccountRecentTransactions` likely uses the same Ubiquity backend shape. Out of scope for this fix but worth checking later.
