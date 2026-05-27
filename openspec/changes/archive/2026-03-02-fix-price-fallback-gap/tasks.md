## Tasks: fix-price-fallback-gap

### 1. Restructure `getSolanaTokenPrice` fallback chain
- [x] 1.1 Refactor `getSolanaTokenPrice()` in `packages/shared/src/api/services/price.ts:117-153` to use sequential fallback: try backend → if no price, try CoinGecko → if still no price, return null. Both steps independently try/caught.

### 2. Extend CoinGecko cache TTL
- [x] 2.1 Change `priceCache` TTL from `60000` (60s) to `300000` (300s) in `packages/shared/src/api/services/price.ts:31`.

### 3. Verify
- [x] 3.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/shared`
