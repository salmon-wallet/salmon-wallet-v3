## ADDED Requirements

### Requirement: HomePage MUST only fetch balance for the active blockchain
The HomePage (both extension and mobile) SHALL call `useBalance` exactly once, for the currently active blockchain account only. Balance data for non-active blockchains SHALL NOT be fetched until the user navigates to that blockchain via the carousel.

#### Scenario: App loads on Solana
- **WHEN** the app loads with Solana as the active blockchain
- **THEN** exactly one balance API call SHALL be made (for the Solana account) and no calls SHALL be made for Bitcoin or Ethereum

#### Scenario: User swipes from Solana to Bitcoin
- **WHEN** the user navigates from Solana to Bitcoin via the carousel
- **THEN** `useBalance` SHALL fetch Bitcoin balance data, and no preemptive fetch SHALL occur for Ethereum or Solana

## REMOVED Requirements

### Requirement: Adjacent balance preloading
**Reason**: The `useAdjacentBalances` hook and the adjacent `useBalance` calls (for prev/next networks) are removed because each hook instance has an isolated cache, making preloaded data unreachable by the active hook on swipe. The preloading provided zero UX benefit while doubling API calls.
**Migration**: No migration needed. The BalanceCardCarousel already handles `undefined` balance data for non-active networks by showing no data. The `switchingNetwork` skeleton mechanism is unaffected.
