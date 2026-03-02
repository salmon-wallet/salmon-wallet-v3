## 1. Fix Bitcoin Transaction Response Mapping

- [x] 1.1 In `packages/shared/src/api/services/bitcoin.ts`, update `fetchBitcoinAccountRecentTransactions` to type the raw API response as `{ data: AccountTransaction[]; meta: { nextPageToken?: string } }` and transform it to `{ items, nextPageToken }` before returning.

## 2. Verify

- [x] 2.1 Run `pnpm typecheck` to confirm no type errors.
- [x] 2.2 Test Bitcoin transaction history on web app at `/activity` with address `18cHdEoVGWB6qBMT18UjQuqQi36pPQ6fp5` against Docker backend.
