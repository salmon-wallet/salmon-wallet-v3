## 1. Export `getJupiterPrices` from balance service

- [x] 1.1 In `packages/shared/src/api/services/balance.ts`: change `getJupiterPrices` from `async function` (private) to `export async function` (public). No other changes to the function body.

## 2. Update DI type signature for Solana prices

- [x] 2.1 In `packages/shared/src/types/transfer.ts`: change `FetchSolanaPricesFn` from `(platform: string) => Promise<TokenPrice[] | null>` to `(networkId: SolanaNetworkId, addresses: string[]) => Promise<Map<string, JupiterApiPriceData>>`. Import `SolanaNetworkId` from `./blockchain` and `JupiterApiPriceData` from `./price`.

## 3. Enrich Solana DI adapter with Jupiter metadata and prices

- [x] 3.1 In `packages/shared/src/api/services/solana.ts`: rewrite `fetchSolanaAccountBalance` to: (a) fetch raw balances from Ubiquity, (b) extract mint addresses from non-native tokens, (c) call `getTokenMetadataByMints(mints, networkId)` to get Jupiter V2 metadata, (d) merge metadata (logo, name, symbol) into balance items (metadata wins over Ubiquity for logo/name/symbol when available), (e) return enriched `SolanaBalanceItem[]` with `uiAmount` calculated.
- [x] 3.2 In `packages/shared/src/api/services/solana.ts`: rewrite `solanaApiFunctions.fetchPrices` to call `getJupiterPrices(addresses, networkId)` instead of `getPricesByPlatform`. The new signature takes `(networkId, addresses)` and returns `Map<string, JupiterApiPriceData>`.

## 4. Update `SolanaAccount.getBalance()` to use Jupiter price path

- [x] 4.1 In `packages/shared/src/blockchain/solana/SolanaAccount.ts`: change `getPrices()` private method signature to accept `addresses: string[]` and call `this.fetchPricesFn(this.network.id, addresses)` returning `Map<string, JupiterApiPriceData>`.
- [x] 4.2 In `packages/shared/src/blockchain/solana/SolanaAccount.ts`: update `getBalance()` to: (a) extract all addresses from `solanaBalance` items (using `mint || 'solana'`), (b) call `getPrices(addresses)` with the extracted addresses, (c) call `decorateBalancePrices(balances, null, jupiterPrices)` using the third parameter (Jupiter mode) instead of the second parameter (CoinGecko mode).
- [x] 4.3 In `packages/shared/src/blockchain/solana/SolanaAccount.ts`: update imports — add `JupiterApiPriceData` from `../../types/price`, add `SOL_CONSTANTS` from `../../utils/balance`. Remove `TokenPrice` import if no longer needed.

## 5. Add SOL-first sorting

- [x] 5.1 In `packages/shared/src/blockchain/solana/SolanaAccount.ts`: after decorating with prices in `getBalance()`, sort the `balances` array: SOL first (address === `SOL_CONSTANTS.ADDRESS`), then by `usdBalance` descending (tokens without usdBalance go last).

## 6. Verification

- [x] 6.1 Run typecheck: `pnpm turbo run typecheck`
- [x] 6.2 Run lint: `pnpm turbo run lint`
- [x] 6.3 Run build: `pnpm turbo run build`
- [x] 6.4 Fix any errors found before marking the change as complete
