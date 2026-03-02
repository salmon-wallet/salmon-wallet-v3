## Capability: price-fallback-resilience

Ensures `getSolanaTokenPrice` always attempts the CoinGecko static API as a fallback when the primary Jupiter backend price source does not return a valid price, and extends the CoinGecko cache TTL to reduce double-failure windows.

### Requirement: Sequential fallback chain

`getSolanaTokenPrice()` MUST attempt the CoinGecko fallback whenever the backend does not yield a price, regardless of failure mode:

#### Scenario: Backend returns 200 with valid usdPrice
- Given: backend responds with `{ usdPrice: number }`
- Then: return the backend price immediately, do NOT call CoinGecko

#### Scenario: Backend returns 200 without usdPrice
- Given: backend responds with 200 but `usdPrice` is undefined
- Then: attempt CoinGecko fallback via `findTokenPrice(coingeckoId || mintAddress, 'solana')`
- And: return CoinGecko price if found, null otherwise

#### Scenario: Backend returns error (404, 500, timeout)
- Given: backend request throws (Axios non-2xx or network error)
- Then: attempt CoinGecko fallback via `findTokenPrice(coingeckoId || mintAddress, 'solana')`
- And: return CoinGecko price if found, null otherwise

#### Scenario: Both sources fail
- Given: backend fails AND CoinGecko fails or returns null
- Then: return null (token gets no price)
- And: no unhandled exceptions propagate to callers

### Requirement: Extended CoinGecko cache TTL

The `priceCache` SmartCache instance used by `getPricesByPlatform()` MUST have a TTL of 300 seconds (5 minutes) instead of 60 seconds, to reduce the probability of both Jupiter and CoinGecko failing in the same time window.

#### Scenario: Cache validity window
- Given: CoinGecko data was fetched successfully
- Then: cached data remains valid for 300 seconds
- And: subsequent calls within 300s return cached data without network requests
