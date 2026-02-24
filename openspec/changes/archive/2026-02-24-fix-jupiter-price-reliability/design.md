## Context

The Salmon Wallet fetches Solana token prices through a chain: client (`packages/shared/src/api/services/price.ts`) → backend (`salmon-api`) → Jupiter Price API v3 → Redis cache.

Current state:
- **Redis TTL**: 5 minutes. After expiry, the next request triggers a cold fetch to Jupiter.
- **No background refresh**: Unlike CoinGecko prices (which have `refreshPricesJob` running every minute), Jupiter prices are only cached on-demand. Once expired, they're gone.
- **No client-side fallback**: `getSolanaTokenPrice()` returns `null` on any error. The CoinGecko static API (`/v1/coins/solana`) has ~2800 Solana tokens with prices but is never consulted as a fallback.
- **Impact**: When prices return `null`, the token's USD value is treated as $0, causing the wallet to under-report total balance (~10% error observed).

## Goals / Non-Goals

**Goals:**
- Eliminate price gaps caused by Redis cache expiry by extending TTL and adding proactive refresh
- Provide a client-side safety net via CoinGecko fallback when the backend Jupiter endpoint fails
- Zero UI changes — purely backend + shared service layer improvements

**Non-Goals:**
- Replacing Jupiter with CoinGecko as the primary price source (Jupiter remains primary)
- Adding client-side caching beyond the existing `SmartCache` in `price.ts`
- Changing the chunking/rate-limiting strategy in `getJupiterPrices()`
- Modifying the `decorateBalancePrices` flow or `SolanaAccount.getBalance()`

## Decisions

### 1. Increase Redis TTL from 5 min to 15 min

**Rationale**: 5 minutes is too aggressive for price data that changes gradually. 15 minutes provides a 3x safety margin while keeping prices reasonably fresh. The CoinGecko job uses a similar cadence (refreshes every minute, but data staleness of ~5 min is acceptable). Most crypto portfolio apps update prices every 5-30 minutes.

**Alternative considered**: 30 minutes — rejected because stale prices for volatile tokens (memecoins) could mislead users more than missing prices.

**Location**: `salmon-api/src/infrastructure/cache/price-cache.js` — change `PRICE_CACHE_TTL` from `5 * 60` to `15 * 60`.

### 2. Add scheduled Jupiter price refresh job

**Rationale**: The existing `refreshPricesJob` only refreshes CoinGecko prices. Adding a similar job for Jupiter ensures the most-requested tokens always have warm cache entries. This prevents the "cold cache" scenario entirely for common tokens.

**Approach**: New serverless function `refreshJupiterPricesJob` triggered every 10 minutes (runs before the 15-min TTL expires). It fetches the top Solana token list from the existing `/v1/top-tokens` endpoint and refreshes their Jupiter prices in bulk.

**Alternative considered**: Using Redis key-expiry notifications to trigger refresh on-demand — rejected due to added infrastructure complexity and race conditions.

**Location**: New handler in `salmon-api/src/handlers/` + new entry in `salmon-api/serverless.yml` under `functions`.

### 3. Add CoinGecko fallback in client `getSolanaTokenPrice()`

**Rationale**: Even with better caching, transient failures can still occur (Lambda cold starts, Jupiter API downtime, rate limits). The CoinGecko static API is already available via `staticApiClient` and `getPricesByPlatform('solana')` — it covers ~2800 Solana tokens. Using it as a fallback provides a second chance at a valid price.

**Approach**: In `getSolanaTokenPrice()`, when the backend call fails or returns null (and it's NOT a 404 "price_not_found"), attempt to find the token in CoinGecko static data using `findTokenPrice(mintAddress, 'solana')`. If found, map `TokenPrice` → `JupiterApiPriceData`.

**Important**: Only fall back on non-404 errors. A 404 means the backend explicitly says "this token has no known price" — CoinGecko is unlikely to have it either. Fallback on: network errors, 5xx, timeouts, rate limits.

**Alternative considered**: Batch CoinGecko fallback in `getJupiterPrices()` — rejected because it would require significant refactoring of the chunking logic. Per-token fallback in `getSolanaTokenPrice()` is simpler and the CoinGecko data is already cached in-memory by `SmartCache` (60s TTL), so repeated lookups are fast.

**Location**: `packages/shared/src/api/services/price.ts` — modify `getSolanaTokenPrice()`.

## Risks / Trade-offs

- **[Stale prices with 15-min TTL]** → Acceptable: users see slightly delayed prices, but always see *a* price rather than $0. The refresh job at 10-min interval means effective staleness is ~10 min for popular tokens.
- **[CoinGecko fallback returns different price than Jupiter]** → Acceptable: CoinGecko and Jupiter prices typically differ by <1%. A slightly different price is far better than $0.
- **[CoinGecko static API could also fail]** → The existing `getPricesByPlatform` already handles this gracefully (returns null). If both fail, behavior is unchanged from today (null → $0).
- **[Refresh job adds load to Jupiter API]** → Mitigated: the job runs every 10 minutes and only refreshes top tokens. The existing rate limiter handles burst protection.
