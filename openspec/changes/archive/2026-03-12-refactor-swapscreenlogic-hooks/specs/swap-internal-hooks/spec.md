## ADDED Requirements

### Requirement: Countdown timer sub-hook

The system SHALL provide a `useCountdownTimer` function co-located in `useSwapScreenLogic.ts` that manages a countdown from `QUOTE_COUNTDOWN_SECONDS` (10). It SHALL accept `{ isActive: boolean }` and return `{ countdown: number, startCountdown: () => void, clearCountdown: () => void }`.

#### Scenario: Timer starts when active
- **WHEN** `isActive` transitions from `false` to `true`
- **THEN** the countdown SHALL start from `QUOTE_COUNTDOWN_SECONDS` and decrement every 1000ms

#### Scenario: Timer stops when inactive
- **WHEN** `isActive` transitions from `true` to `false`
- **THEN** the interval SHALL be cleared and countdown reset

#### Scenario: Countdown reaches zero
- **WHEN** countdown reaches 0
- **THEN** the interval SHALL be cleared and countdown SHALL remain at 0

### Requirement: Quote manager sub-hook

The system SHALL provide a `useQuoteManager` function co-located in `useSwapScreenLogic.ts` that handles debounced quote fetching for both Jupiter and StealthEx modes. It SHALL accept token/amount inputs and callback refs, and return `{ outAmount, isLoadingQuote, isLoadingBridgeEstimate, quote, bridgeEstimate }`.

#### Scenario: Debounced quote fetch on input change
- **WHEN** `inToken`, `outToken`, or `inAmount` changes
- **THEN** the hook SHALL debounce for `QUOTE_DEBOUNCE_MS` (500ms) then call the appropriate quote callback based on swap mode

#### Scenario: Clear quote on token change
- **WHEN** token selection changes
- **THEN** existing `outAmount`, `quote`, and `bridgeEstimate` SHALL be cleared immediately before debounce

### Requirement: Token sync sub-hook

The system SHALL provide a `useTokenSync` function co-located in `useSwapScreenLogic.ts` that synchronizes `inToken` and `outToken` with upstream token list changes. It SHALL use the existing `findMatchingToken` and `hasTokenSnapshotChanged` helpers.

#### Scenario: Input token sync on list change
- **WHEN** the `tokens` array changes and the current `inToken` snapshot has changed
- **THEN** `inToken` SHALL be updated to the matching token from the new list

#### Scenario: Output token sync on available tokens change
- **WHEN** `outputTokens` changes and the current `outToken` snapshot has changed
- **THEN** `outToken` SHALL be updated to the matching token from the new output list
