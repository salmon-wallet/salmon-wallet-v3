## ADDED Requirements

### Requirement: Jupiter price cache TTL is 15 minutes
The backend Redis cache for Jupiter price data SHALL use a TTL of 15 minutes (900 seconds) instead of 5 minutes (300 seconds).

#### Scenario: Price is cached and served within TTL
- **WHEN** a Jupiter price is fetched for a token and cached in Redis
- **THEN** the cached price SHALL remain available for 15 minutes before expiring

#### Scenario: Price expires after TTL
- **WHEN** 15 minutes have elapsed since a Jupiter price was cached
- **THEN** the cached entry SHALL be evicted and the next request SHALL trigger a fresh fetch from Jupiter

### Requirement: Scheduled job refreshes Jupiter prices for top tokens
The backend SHALL run a scheduled job (`refreshJupiterPricesJob`) every 10 minutes that proactively refreshes Jupiter price cache entries for the most popular Solana tokens.

#### Scenario: Refresh job triggers on schedule
- **WHEN** 10 minutes have elapsed since the last refresh
- **THEN** the job SHALL fetch the list of top Solana tokens and refresh their Jupiter prices in Redis

#### Scenario: Refresh job keeps cache warm
- **WHEN** the refresh job runs every 10 minutes and the cache TTL is 15 minutes
- **THEN** popular token prices SHALL never expire from cache under normal operation, because they are refreshed before the 15-minute TTL elapses

#### Scenario: Refresh job handles errors gracefully
- **WHEN** the Jupiter API is temporarily unavailable during a refresh cycle
- **THEN** the job SHALL log the error and exit without crashing, leaving existing cached prices untouched until they expire naturally
