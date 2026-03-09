## Why

`getSolanaTokenPrice()` has two gaps in its price fallback chain that can leave tokens without USD prices, causing incorrect portfolio totals (e.g., $6.16 instead of $12.43 because USDC's $6.27 is missing). First, when the backend returns 200 OK without a `usdPrice` field, the function returns `null` without attempting the CoinGecko fallback (which only lives in the `catch` block). Second, the CoinGecko static price cache has a 60-second TTL — if the cache expires at the same moment Jupiter's backend cache misses for a token, both sources fail simultaneously and the token gets no price.

## What Changes

- Restructure `getSolanaTokenPrice()` so the CoinGecko fallback is attempted whenever the backend does not return a valid price, regardless of whether the failure was an HTTP error (404/500) or a 200 response missing `usdPrice`.
- Increase the CoinGecko price cache TTL from 60 seconds to 5 minutes (300s) to reduce the window where both Jupiter and CoinGecko can fail simultaneously. Token prices don't change fast enough to warrant 60s refresh on a fallback-only cache.

## Capabilities

### New Capabilities
- `price-fallback-resilience`: Ensures `getSolanaTokenPrice` always attempts the CoinGecko fallback when the primary Jupiter price source fails, and extends the CoinGecko cache TTL to reduce double-failure windows.

### Modified Capabilities

## Impact

- **Packages affected**: `packages/shared` only (`src/api/services/price.ts`)
- **No API changes**: Same function signature, same return type, same callers
- **No breaking changes**: Purely internal resilience improvement
- **Risk**: Minimal — only changes error/fallback paths, not the happy path. Longer CoinGecko cache means slightly staler fallback prices (acceptable for a fallback).
