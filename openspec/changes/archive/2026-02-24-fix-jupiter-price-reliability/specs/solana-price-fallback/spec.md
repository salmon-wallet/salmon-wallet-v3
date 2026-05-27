## ADDED Requirements

### Requirement: CoinGecko fallback when Jupiter price endpoint fails
The client-side `getSolanaTokenPrice()` function in `packages/shared/src/api/services/price.ts` SHALL attempt to fetch the token price from the CoinGecko static API when the backend Jupiter price endpoint returns a non-404 error.

#### Scenario: Backend returns server error, CoinGecko has the price
- **WHEN** the backend Jupiter price endpoint returns a 5xx error for a token
- **AND** the CoinGecko static API (`/v1/coins/solana`) has price data for that token
- **THEN** `getSolanaTokenPrice()` SHALL return the CoinGecko price mapped to `JupiterApiPriceData` format (`usdPrice` from `TokenPrice.usdPrice`, `priceChange24h` from `TokenPrice.perc24HoursChange`)

#### Scenario: Backend returns network error, CoinGecko has the price
- **WHEN** the backend Jupiter price endpoint fails with a network/timeout error
- **AND** the CoinGecko static API has price data for that token
- **THEN** `getSolanaTokenPrice()` SHALL return the CoinGecko price mapped to `JupiterApiPriceData` format

#### Scenario: Backend returns 404 (price not found), no fallback
- **WHEN** the backend Jupiter price endpoint returns 404 for a token
- **THEN** `getSolanaTokenPrice()` SHALL return `null` without attempting CoinGecko fallback, because 404 means the token genuinely has no known price

#### Scenario: Both Jupiter and CoinGecko fail
- **WHEN** the backend Jupiter price endpoint fails with a non-404 error
- **AND** the CoinGecko static API also fails or does not have the token
- **THEN** `getSolanaTokenPrice()` SHALL return `null` (unchanged behavior)

#### Scenario: Backend succeeds, no fallback needed
- **WHEN** the backend Jupiter price endpoint returns a valid price
- **THEN** `getSolanaTokenPrice()` SHALL return that price directly without consulting CoinGecko
