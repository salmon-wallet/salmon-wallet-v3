## ADDED Requirements

### Requirement: useBalance cache MUST key by account identity
The `useBalance` hook (`packages/shared/src/hooks/useBalance.ts`) SHALL include the account's address (via `getReceiveAddress()`) in its cache entry. When `fetchBalance` checks the cache, it MUST compare the stored account key against the current account's address. A mismatch SHALL be treated as a cache miss, triggering a fresh fetch regardless of timestamp.

#### Scenario: Switch from Solana to Bitcoin within cache TTL
- **WHEN** the user is viewing Solana balance (cached < 60s ago) and navigates to the Bitcoin card
- **THEN** `useBalance` MUST NOT return the cached Solana data for the Bitcoin account; it SHALL fetch Bitcoin balance data from the blockchain

#### Scenario: Return to previously viewed blockchain
- **WHEN** the user navigates from Solana → Bitcoin → back to Solana
- **THEN** `useBalance` MUST fetch fresh Solana data (cache was invalidated when account changed to Bitcoin)

#### Scenario: Same account re-render within TTL
- **WHEN** `useBalance` re-renders with the same account and cache is within the 60s TTL
- **THEN** the cache SHALL hit and return the stored data without re-fetching (existing behavior preserved)

### Requirement: useBalance MUST reset state when account changes
The `useBalance` hook SHALL detect when the `account` parameter changes to a different account (different `getReceiveAddress()`). Upon detecting the change, it MUST immediately set `balance` to `null` and `loading` to `true` before the new fetch begins. This prevents stale data from the previous account from being visible during the transition.

#### Scenario: Account changes from Solana to Ethereum
- **WHEN** the `account` parameter changes from a Solana account to an Ethereum account
- **THEN** `balance` SHALL be `null`, `usdTotal` SHALL be `undefined`, `loading` SHALL be `true` until the Ethereum fetch completes

#### Scenario: Account changes to undefined (skip)
- **WHEN** the `account` parameter changes to `undefined`
- **THEN** `balance` SHALL be `null`, `loading` SHALL be `false`, and no fetch SHALL be initiated

### Requirement: useAccounts MUST expose a switchingNetwork flag
The `useAccounts` hook (`packages/shared/src/hooks/useAccounts.ts`) SHALL expose a `switchingNetwork: boolean` state. The `changeNetwork` function MUST set `switchingNetwork` to `true` before updating `networkId`. The consuming component SHALL clear `switchingNetwork` when the new balance data has loaded (`loading` becomes `false`).

#### Scenario: User triggers blockchain switch via carousel
- **WHEN** `changeNetwork` is called with a new network ID
- **THEN** `switchingNetwork` SHALL be `true` immediately, and SHALL remain `true` until the consuming component clears it after balance loading completes

#### Scenario: changeNetwork called with the same network ID
- **WHEN** `changeNetwork` is called with the currently active network ID
- **THEN** `switchingNetwork` SHALL NOT be set to `true` (early return, no-op)

### Requirement: BalanceCard MUST show skeleton during blockchain switch
On both extension and mobile, when `switchingNetwork` is `true`, the `blockchainBalances` builder SHALL set `usdTotal`, `changePercent`, and `changeAmount` to `undefined` and `loading` to `true` for the active network entry. This causes the BalanceCard to render its existing skeleton placeholders for the balance and 24h change rows.

#### Scenario: Extension — switch from Solana to Bitcoin via right arrow
- **WHEN** the user clicks the right arrow on the extension carousel and `switchingNetwork` becomes `true`
- **THEN** the BalanceCard SHALL display skeleton rectangles for the balance value and 24h change until Bitcoin data loads

#### Scenario: Mobile — swipe from Solana to Ethereum
- **WHEN** the user swipes left on the mobile carousel and `switchingNetwork` becomes `true`
- **THEN** the BalanceCard SHALL display skeleton placeholders for the balance value and 24h change until Ethereum data loads

### Requirement: TokenList MUST show skeleton during blockchain switch for Solana and Ethereum
On both extension and mobile, when `switchingNetwork` is `true` and the target blockchain is Solana or Ethereum, the token list section SHALL receive an empty tokens array and `loading: true`. This causes the existing `TokenListSkeleton` component to render.

#### Scenario: Extension — switch to Ethereum network
- **WHEN** `switchingNetwork` is `true` and the active blockchain is Ethereum
- **THEN** `TokenList` SHALL receive `tokens=[]` and `loading=true`, rendering `TokenListSkeleton` with 5 skeleton items

#### Scenario: Mobile — switch to Solana network
- **WHEN** `switchingNetwork` is `true` and the active blockchain is Solana
- **THEN** `TokenList` SHALL receive an empty tokens array and `loading=true`, rendering `TokenListSkeleton`

### Requirement: Bitcoin view MUST show skeleton during blockchain switch
On both extension and mobile, when `switchingNetwork` is `true` and the target blockchain is Bitcoin, the Bitcoin section SHALL display a skeleton placeholder instead of the `TokenListItem`. The existing `TokenListSkeleton` component with `count={1}` SHALL be used.

#### Scenario: Extension — switch to Bitcoin network
- **WHEN** `switchingNetwork` is `true` and the active blockchain is Bitcoin
- **THEN** a single skeleton item (`TokenListSkeleton` with `count=1`) SHALL render in place of the Bitcoin `TokenListItem`

#### Scenario: Mobile — switch to Bitcoin network
- **WHEN** `switchingNetwork` is `true` and the active blockchain is Bitcoin
- **THEN** a single skeleton item SHALL render in place of the Bitcoin `TokenListItem`

### Requirement: Skeleton state MUST clear when new data loads
On both platforms, the skeleton state SHALL clear automatically once the new blockchain's balance data finishes loading. The `switchingNetwork` flag SHALL be set to `false` when `loading` transitions from `true` to `false` after a network change.

#### Scenario: Bitcoin data loads after switch
- **WHEN** `switchingNetwork` is `true` and Bitcoin balance data finishes loading (`loading` becomes `false`)
- **THEN** `switchingNetwork` SHALL be set to `false`, BalanceCard SHALL display the real Bitcoin balance, and the Bitcoin `TokenListItem` SHALL render with actual data

#### Scenario: Rapid carousel navigation
- **WHEN** the user quickly navigates through multiple blockchains (e.g., Solana → Bitcoin → Ethereum in rapid succession)
- **THEN** each transition SHALL show skeleton states, and only the final blockchain's data SHALL be displayed once its fetch completes

### Requirement: HomePage MUST only fetch balance for the active blockchain
The HomePage (both extension and mobile) SHALL call `useBalance` exactly once, for the currently active blockchain account only. Balance data for non-active blockchains SHALL NOT be fetched until the user navigates to that blockchain via the carousel.

#### Scenario: App loads on Solana
- **WHEN** the app loads with Solana as the active blockchain
- **THEN** exactly one balance API call SHALL be made (for the Solana account) and no calls SHALL be made for Bitcoin or Ethereum

#### Scenario: User swipes from Solana to Bitcoin
- **WHEN** the user navigates from Solana to Bitcoin via the carousel
- **THEN** `useBalance` SHALL fetch Bitcoin balance data, and no preemptive fetch SHALL occur for Ethereum or Solana
