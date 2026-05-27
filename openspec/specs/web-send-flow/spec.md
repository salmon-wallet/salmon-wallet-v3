# web-send-flow Specification

## Purpose

Wire the web `/send` route to the shared `SendPage` from `@salmon/ui`, fed by `useBalance` tokens, the active `BlockchainAccount`, and a blockchain type derived from `networkId`. The route SHALL navigate home on success, return to `/home` on back, and pass `useUserConfig().developerNetworks` as `showUnverifiedTokens` so developer mode can select unverified tokens.

## Requirements

### Requirement: SendRoute renders SendPage with real data
The SendRoute SHALL render SendPage from `@salmon/ui` wired with tokens from `useBalance()`, the active `BlockchainAccount`, and the current blockchain type derived from `networkId`.

#### Scenario: User opens send page
- **WHEN** user navigates to `/send`
- **THEN** SendPage renders with the user's token list for token selection, address input, and amount input

#### Scenario: User completes a transaction
- **WHEN** user fills in recipient, selects token, enters amount, and confirms
- **THEN** SendPage internally uses `useSendTransaction()` to estimate fees and submit, and on success calls `onSuccess` which navigates to `/home`

### Requirement: SendRoute back navigation
The onBack callback SHALL navigate to `/home`.

#### Scenario: User cancels send
- **WHEN** user clicks back button on SendPage
- **THEN** app navigates to `/home`

### Requirement: SendRoute passes developer mode flag
The SendRoute SHALL pass `showUnverifiedTokens` from `useUserConfig().developerNetworks` to allow selecting unverified tokens in developer mode.

#### Scenario: Developer mode enabled
- **WHEN** developerNetworks is true
- **THEN** SendPage shows unverified/unknown tokens in the token selector
