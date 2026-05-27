## Context

The DI refactor unified balance fetching across Solana/Ethereum/Bitcoin via `account.getBalance()`. However, Solana's DI adapter (`solanaApiFunctions`) was wired to use CoinGecko batch prices (`getPricesByPlatform('solana')`) instead of the original Jupiter per-token prices. This causes data loss because:

1. `decorateBalancePrices(balances, prices)` uses CoinGecko mode — matches by `coingeckoId` then `symbol`
2. Ubiquity only returns `coingeckoId` for native SOL, not SPL tokens
3. CoinGecko has limited SPL token coverage compared to Jupiter

The old working flow in `getWalletBalance()` (still in `balance.ts`) used `decorateBalancePrices(balances, null, jupiterPrices)` — Jupiter mode that matches by mint address, covering ALL SPL tokens with liquidity.

### Existing code that already works and can be reused

- `getJupiterPrices(addresses, networkId)` in `api/services/balance.ts` — fetches per-token Jupiter prices with rate-limit chunking
- `getTokenMetadataByMints(mints, networkId)` in `api/services/tokens.ts` — fetches Jupiter V2 metadata (logo, name, symbol)
- `decorateBalancePrices(balances, null, jupiterPrices)` — Jupiter mode already exists as the third parameter path
- `decorateBalanceList(balances, metadata)` in `utils/balance.ts` — merges raw balances with token metadata
- `getSolanaTokenPrice(mint, networkId)` in `api/services/price.ts` — single Jupiter price fetch
- `SOL_CONSTANTS` in `utils/balance.ts` — SOL address constant for sorting

## Goals / Non-Goals

**Goals:**
- Restore Jupiter prices for Solana tokens (match by mint address)
- Restore Jupiter V2 metadata enrichment (logos, names)
- Restore SOL-first sorting by USD balance
- Keep the DI architecture intact — changes only inside the DI adapter and `SolanaAccount.getBalance()`

**Non-Goals:**
- Changing Ethereum or Bitcoin balance flows (they work fine with CoinGecko)
- Modifying the backend API
- Changing the `useBalance` hook (it calls `account.getBalance()` which is the correct abstraction)
- Changing the DI type signatures (avoid breaking the interface contract)

## Decisions

### Decision 1: Enrich balance inside `fetchSolanaAccountBalance` DI adapter

**Approach**: After fetching raw balances from Ubiquity, call `getTokenMetadataByMints` to enrich with Jupiter metadata (logo, name, symbol). Merge the metadata into the balance items before returning.

**Why**: The DI adapter is the right place — it's where we translate backend data to the `SolanaBalanceItem[]` shape. The account class shouldn't know about metadata enrichment.

**Alternative considered**: Enriching inside `SolanaAccount.getBalance()` — rejected because the account class would need a new DI function for metadata, expanding the interface unnecessarily.

### Decision 2: Change `FetchSolanaPricesFn` return type to support Jupiter prices

**Approach**: Change the DI prices function to return `Map<string, JupiterApiPriceData>` instead of `TokenPrice[] | null`. This lets `SolanaAccount.getBalance()` call `decorateBalancePrices(balances, null, jupiterPrices)` — the Jupiter mode path.

**Why**: The type change is scoped — only `SolanaAccount` consumes `FetchSolanaPricesFn`. The function signature changes from `(platform: string) => Promise<TokenPrice[] | null>` to `(networkId: string, addresses: string[]) => Promise<Map<string, JupiterApiPriceData>>`. This is more accurate since Jupiter prices need the mint addresses, not a platform string.

**Alternative considered**: Keeping the same return type and doing a post-hoc conversion inside `getBalance()` — rejected because it would be a leaky abstraction and the CoinGecko data simply doesn't have the information we need.

### Decision 3: Add sorting inside `SolanaAccount.getBalance()`

**Approach**: After decorating with prices, sort items: SOL first (by address === `SOL_CONSTANTS.ADDRESS`), then by `usdBalance` descending. Import `SOL_CONSTANTS` from `utils/balance`.

**Why**: Sorting is a presentation concern that the old `getWalletBalance` handled. The account class is the closest shared layer, and the sort is cheap.

### Decision 4: Reuse `getJupiterPrices` from `balance.ts` in the DI adapter

**Approach**: Export `getJupiterPrices` from `api/services/balance.ts` (currently private) and use it in the Solana DI adapter's `fetchPrices` implementation.

**Why**: The function already exists with rate-limit chunking and error handling. No need to duplicate.

## Risks / Trade-offs

**[N+1 HTTP calls for prices]** → Jupiter prices require one HTTP call per token. The existing `getJupiterPrices` already mitigates this with chunking (5 concurrent, 100ms delay). For a typical wallet with 10-20 tokens, this means 2-4 sequential chunks. The old flow had this same behavior and it worked fine.

**[DI type signature change]** → Changing `FetchSolanaPricesFn` is a breaking change to the interface. Mitigation: only `SolanaAccount` consumes it, and the factory wires it. The change is fully contained in `packages/shared`. No app-level changes needed.

**[Metadata fetch adds latency]** → The `getTokenMetadataByMints` call in the balance adapter adds one extra HTTP request. Mitigation: this is the same call the old flow made, and it runs in parallel with the balance fetch if we restructure slightly. The backend caches Jupiter data in Redis.
