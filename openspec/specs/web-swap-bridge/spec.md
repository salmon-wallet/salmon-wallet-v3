## ADDED Requirements

### Requirement: SwapTab renders SwapScreen with real data
The SwapTab (rendered inside HomePage's swap tab) SHALL render SwapScreen from `@salmon/ui` wired with `useSwap()` for quote/execute and `useBalance().tokens` for token selection.

#### Scenario: User views swap tab
- **WHEN** user switches to Swap tab
- **THEN** SwapScreen renders with token selectors, amount input, and a swap button

#### Scenario: User gets a quote
- **WHEN** user selects input/output tokens and enters an amount
- **THEN** SwapScreen calls `useSwap().getQuote()` and displays the estimated output amount, route, and fees

#### Scenario: User executes swap
- **WHEN** user confirms the swap
- **THEN** `useSwap().executeSwap()` is called, and on success the balance refreshes

### Requirement: SwapTab provides bridge functionality
The SwapTab SHALL wire bridge props on SwapScreen using `useBridge()` for cross-chain token swaps.

#### Scenario: User initiates bridge
- **WHEN** user selects tokens on different chains (e.g., ETH → SOL)
- **THEN** SwapScreen switches to bridge mode using `useBridge()` for estimates and exchange creation

### Requirement: SwapTab navigates home on success
The `onNavigateHome` callback SHALL switch the active tab back to home and refresh balances.

#### Scenario: Swap completes
- **WHEN** swap or bridge transaction succeeds
- **THEN** active tab switches to home and `useBalance().refresh()` is called
