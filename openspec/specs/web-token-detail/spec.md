## ADDED Requirements

### Requirement: TokenDetailRoute renders TokenDetailPage with live data
The TokenDetailRoute SHALL find the token by URL param `:address` in `useBalance().tokens`, then render TokenDetailPage from `@salmon/ui` with chart data and market data fetched from CoinGecko API.

#### Scenario: User navigates to token detail from home
- **WHEN** user clicks a token in the home TokenList
- **THEN** app navigates to `/token/{address}` and renders TokenDetailPage with the token's balance, price, and chart

#### Scenario: Deep link to token detail
- **WHEN** user navigates directly to `/token/{address}` without passing through home
- **THEN** the route fetches the token via `useBalance().tokens` lookup (balance hook auto-fetches on mount) and renders TokenDetailPage once data is available

### Requirement: TokenDetailRoute fetches chart data
The TokenDetailRoute SHALL fetch price chart data using `getMarketChart()` from `@salmon/shared` when the token has a `coingeckoId`. Period changes SHALL re-fetch chart data.

#### Scenario: User changes chart period
- **WHEN** user selects "1W" period on the chart
- **THEN** `getMarketChart(coingeckoId, 7, currency)` is called and chart updates with new data points

#### Scenario: Token has no coingeckoId
- **WHEN** token does not have a coingeckoId (e.g., unknown SPL token)
- **THEN** chart section shows empty state, no API call is made

### Requirement: TokenDetailRoute fetches market data
The TokenDetailRoute SHALL fetch coin info using `getCoinInfo()` from `@salmon/shared` and derive market data (market cap, volume, supply, ATH/ATL) via `coinInfoToMarketData()`.

#### Scenario: Market data loads
- **WHEN** token has a coingeckoId and getCoinInfo resolves
- **THEN** TokenDetailPage shows market cap, 24h volume, circulating supply, ATH, ATL

### Requirement: TokenDetailRoute back navigation
The onBack callback SHALL navigate to `/home`.

#### Scenario: User goes back
- **WHEN** user clicks back button on TokenDetailPage
- **THEN** app navigates to `/home`
