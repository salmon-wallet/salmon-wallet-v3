## 1. Backend: Jupiter Price Cache TTL

- [x] 1.1 In `salmon-api/src/infrastructure/cache/price-cache.js`, change `PRICE_CACHE_TTL` from `5 * 60` (300s) to `15 * 60` (900s)

## 2. Backend: Scheduled Jupiter Price Refresh Job

- [x] 2.1 In `salmon-api/src/jobs/handler.js`, add `refreshJupiterPricesJob` handler that fetches top 50 Solana tokens via `jupiterTokenService.getTopTokens()` and calls `jupiterService.price()` for each to warm the Redis cache. Processes in batches of 5 with 200ms delay. Logs success/failure counts. Wrapped in try/catch.
- [x] 2.2 In `salmon-api/serverless.yml`, add `refreshJupiterPricesJob` function with `schedule: rate(10 minutes)` trigger, timeout 120s

## 3. Client: CoinGecko Fallback in getSolanaTokenPrice

- [x] 3.1 In `packages/shared/src/api/services/price.ts`, modify `getSolanaTokenPrice()` to: on non-404 errors, attempt `findTokenPrice(mintAddress, 'solana')` as fallback. If found, map `TokenPrice` → `JupiterApiPriceData` (`{ usdPrice: tp.usdPrice, priceChange24h: tp.perc24HoursChange }`). On 404, return `null` immediately (no fallback).
