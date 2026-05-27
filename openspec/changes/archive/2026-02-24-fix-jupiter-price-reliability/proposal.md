## Why

Jupiter price data cached in Redis expires after 5 minutes with no background refresh, so any request that arrives after expiry triggers a cold fetch — which can fail due to Lambda cold starts, rate limits, or transient network errors. When a price fetch fails, the client receives `null` and treats the token's USD value as $0, causing the wallet to under-report total balance (observed: $4.69 vs correct $5.14, a ~10% error).

## What Changes

- **Increase Jupiter price cache TTL** from 5 minutes to 15 minutes in the backend, reducing the window where stale-or-missing prices can occur.
- **Add a scheduled refresh job for Jupiter prices** (similar to the existing `refreshPricesJob` for CoinGecko) that proactively refreshes cached Solana token prices before they expire, ensuring warm cache hits for the most-requested tokens.
- **Add CoinGecko fallback in the client price service** so that when the backend Jupiter price endpoint returns an error or null, the client attempts to fetch the price from the CoinGecko static API before giving up. This provides a second chance at getting a valid price.

## Capabilities

### New Capabilities
- `jupiter-price-cache`: Backend Jupiter price caching strategy — TTL configuration, scheduled refresh job, and cache-warming logic for Solana token prices.
- `solana-price-fallback`: Client-side price fallback chain — when the primary backend price endpoint fails for a Solana token, fall back to the CoinGecko static API before returning null.

### Modified Capabilities
<!-- No existing specs are affected — pricing was not previously specified. -->

## Impact

- **Backend (`salmon-api/`)**: `price-cache.js` (TTL change), `serverless.yml` (new scheduled function), new handler/service code for Jupiter price refresh job.
- **Client (`packages/shared/`)**: `api/services/price.ts` (add CoinGecko fallback in `getSolanaTokenPrice`).
- **No UI changes** — this is entirely backend + shared service layer.
- **No breaking changes** — all modifications are additive or increase existing TTLs.
- **Both mobile and extension benefit** since they share `packages/shared`.
