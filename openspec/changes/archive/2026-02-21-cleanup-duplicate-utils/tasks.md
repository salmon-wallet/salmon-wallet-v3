## 1. Search & Reuse Audit

- [x] 1.1 Verify `truncateHash(hash, chars)` in `packages/shared/src/utils/address.ts` accepts optional `chars` parameter (needed for TransactionDetailModal which uses chars=8)
- [x] 1.2 Verify `formatRawAmount(amount, decimals, minThreshold?)` in `packages/shared/src/utils/formatting.ts` accepts optional `minThreshold` parameter
- [x] 1.3 Verify `formatRelativeTimeCompact(timestamp)` in `packages/shared/src/utils/date.ts` matches the thresholds used by local `formatTimestamp` (1min, 1h, 1d cutoffs)
- [x] 1.4 Verify `formatConversionRate(rate)` in `packages/shared/src/utils/formatting.ts` is character-identical to local `formatRate`
- [x] 1.5 Verify `isPositive(value)` in `packages/shared/src/utils/formatting.ts` accepts the type that PriceChart passes (number vs string)
- [x] 1.6 Verify `canonicalNftToSolanaNftData(nft)` in `packages/shared/src/utils/nft.ts` returns a type compatible with how `solanaNftToNftData` is used in collectibles.tsx

## 2. Extension — TransactionDetailModal

- [x] 2.1 In `apps/extension/src/components/TransactionDetailModal/TransactionDetailModal.tsx`: delete local `truncateHash` function, add import `{ truncateHash }` from `@salmon/shared`, update call sites to use `truncateHash(hash, 8)` where needed
- [x] 2.2 In same file: delete local `formatAmount` function, add import `{ formatRawAmount }` from `@salmon/shared`, replace all `formatAmount(...)` calls with `formatRawAmount(...)`

## 3. Extension — TransactionHistoryPage

- [x] 3.1 In `apps/extension/src/components/TransactionHistoryPage/SwapRouteVisualization.tsx`: delete local `truncateHash` function, import `{ truncateHash }` from `@salmon/shared`
- [x] 3.2 In same file: delete local `formatAmount` function, import `{ formatRawAmount }` from `@salmon/shared`, replace calls
- [x] 3.3 In `apps/extension/src/components/TransactionHistoryPage/TransactionItem.tsx`: delete local `formatAmount` function, import `{ formatRawAmount }` from `@salmon/shared`, replace calls
- [x] 3.4 In same file: delete local `formatTimestamp` function, import `{ formatRelativeTimeCompact }` from `@salmon/shared`, replace calls

## 4. Extension — ConversionRateDisplay

- [x] 4.1 In `apps/extension/src/components/TransactionHistoryPage/ConversionRateDisplay.tsx`: delete local `formatRate` function, import `{ formatConversionRate }` from `@salmon/shared`, replace calls

## 5. Extension — PriceChart

- [x] 5.1 **SKIPPED** — `isPositivePerformance(data: PriceDataPoint[])` is NOT equivalent to `isPositive(perc: number)`. Different signature (array vs number), different semantics (`>=` vs `>`). Not a drop-in replacement. Will be addressed in Change 2 (`centralize-orphan-utils`).

## 6. Extension — DAppConnectPage

- [x] 6.1 In `apps/extension/src/pages/dapp/DAppConnectPage.tsx`: replace inline `${address.slice(0, 4)}...${address.slice(-4)}` with `getShortAddress(address, 4)`, add import `{ getShortAddress }` from `@salmon/shared`

## 7. Mobile — Collectibles

- [x] 7.1 In `apps/mobile/app/(app)/(tabs)/collectibles.tsx`: delete local `SECTION_TO_NETWORK` constant, import `{ SECTION_TO_NETWORK }` from `@salmon/shared`
- [x] 7.2 In same file: delete local `solanaNftToNftData` function, import `{ canonicalNftToSolanaNftData }` from `@salmon/shared`, replace calls and adjust type annotations if needed
- [x] 7.3 In same file: delete local `getSectionTitle` function, import `{ getNftSectionTitle }` from `@salmon/shared`, replace calls

## 8. Verification

- [x] 8.1 Run typecheck: `pnpm turbo run typecheck` — PASSED (4/4 packages)
- [x] 8.2 Run lint: `pnpm turbo run lint` — PASSED (no new errors; pre-existing error in SendSheet.tsx unrelated to this change)
- [x] 8.3 Run build: `pnpm turbo run build` — PASSED (extension build successful)
- [x] 8.4 Fix any errors found before marking the change as complete — No errors to fix
