## Design: fix-price-fallback-gap

### Current Behavior

`getSolanaTokenPrice()` in `packages/shared/src/api/services/price.ts:117-153`:

```
try {
  backend GET /v1/{networkId}/ft/price/{mint}
  if (data?.usdPrice !== undefined) → return price ✓
  return null  ← GAP: CoinGecko fallback NOT attempted
} catch {
  CoinGecko fallback → findTokenPrice(coingeckoId || mint, 'solana')
  return null if fallback also fails
}
```

Two problems:
1. The `return null` on line 132 exits without trying CoinGecko (only errors reach the catch block)
2. `priceCache` in `price.ts:31` uses `SmartCache({ maxSize: 10, ttl: 60000 })` — 60s TTL means the CoinGecko data expires frequently, opening a window where both Jupiter and CoinGecko fail simultaneously

### Decision: Restructure to sequential fallback chain

Flatten the try/catch into a sequential two-step approach:

```
Step 1: Try backend → if price found, return it
Step 2: Try CoinGecko → if price found, return it
Step 3: return null
```

Both steps are independently try/caught so one failure never prevents the other from running.

### Implementation

**`getSolanaTokenPrice` refactor** — same signature, same return type:

```typescript
export async function getSolanaTokenPrice(
  mintAddress: string,
  networkId: SolanaNetworkId = 'solana-mainnet',
  coingeckoId?: string
): Promise<JupiterApiPriceData | null> {
  // Step 1: Try backend (Jupiter proxy)
  try {
    const { data } = await apiClient.get<{ usdPrice?: number; priceChange24h?: number | null }>(
      `/v1/${networkId}/ft/price/${mintAddress}`
    );
    if (data?.usdPrice !== undefined) {
      return {
        usdPrice: data.usdPrice,
        priceChange24h: data.priceChange24h ?? null,
      };
    }
  } catch {
    // Backend failed — fall through to CoinGecko
  }

  // Step 2: CoinGecko fallback (always attempted if backend didn't return a price)
  try {
    const lookupKey = coingeckoId || mintAddress;
    const fallback = await findTokenPrice(lookupKey, 'solana');
    if (fallback) {
      return {
        usdPrice: fallback.usdPrice,
        priceChange24h: fallback.perc24HoursChange,
      };
    }
  } catch {
    // CoinGecko also failed
  }

  return null;
}
```

**Cache TTL change** — `price.ts:31`:

```typescript
// Before:
const priceCache = new SmartCache<TokenPrice[]>({ maxSize: 10, ttl: 60000 });

// After:
const priceCache = new SmartCache<TokenPrice[]>({ maxSize: 10, ttl: 300000 });
```

300s (5 min) is safe for a fallback-only cache. CoinGecko prices update every ~60s on their end, but stale-by-4-minutes is acceptable when it's the last resort before showing no price at all.

### Files

| File | Change |
|------|--------|
| `packages/shared/src/api/services/price.ts` | Restructure `getSolanaTokenPrice`, update cache TTL |

### What does NOT change

- Function signature and return type (callers unaffected)
- `getJupiterPrices`, `decorateBalancePrices`, `SolanaAccount.getBalance()` — untouched
- The happy path (backend returns price) — identical behavior
- Bitcoin/Ethereum price paths — they use `getPricesByPlatform` directly, not `getSolanaTokenPrice`
