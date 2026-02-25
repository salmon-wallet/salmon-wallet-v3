## ADDED Requirements

### Requirement: Full Jupiter catalog as receive tokens for Solana input
When the swap input token is on the Solana chain, the receive-token list SHALL include the full Jupiter verified token catalog. Tokens the user holds (with balance) SHALL appear first, followed by the remaining Jupiter tokens. The catalog SHALL be loaded using the existing `getTokenList()` from `packages/shared/src/api/services/tokens.ts`.

#### Scenario: Solana input shows full Jupiter catalog
- **WHEN** the user selects a Solana token (e.g., SOL) as swap input
- **THEN** the receive list SHALL contain all Jupiter verified tokens (~1000+)
- **AND** tokens the user holds with balance SHALL appear before tokens with zero balance
- **AND** each token SHALL have `chain: 'solana'` and `networkId: 'solana-mainnet'`

#### Scenario: Non-Solana input does not use Jupiter catalog
- **WHEN** the user selects a non-Solana token (e.g., BTC) as swap input
- **THEN** the receive list SHALL NOT include Jupiter tokens
- **AND** SHALL only include tokens from the StealthEx bridge API

### Requirement: StealthEx restricted to cross-chain when input is Solana
When the swap input token is on the Solana chain, the bridge token portion of the receive list SHALL exclude tokens where `chain === 'solana'`. Only cross-chain bridge destinations (e.g., BTC) SHALL appear from StealthEx.

#### Scenario: Solana input excludes StealthEx Solana tokens
- **WHEN** the user selects SOL as swap input
- **AND** StealthEx returns bridge tokens including BTC (`chain: 'bitcoin'`) and USDC-SOL (`chain: 'solana'`)
- **THEN** only BTC SHALL appear from the bridge tokens
- **AND** USDC-SOL from StealthEx SHALL be excluded (Jupiter covers it)

#### Scenario: BTC input includes all StealthEx tokens
- **WHEN** the user selects BTC as swap input
- **AND** StealthEx returns SOL and Solana SPL tokens
- **THEN** all returned Solana tokens SHALL appear in the receive list

### Requirement: jupiterTokens prop on SwapScreenProps
`SwapScreenProps` in `packages/shared/src/types/swap.ts` SHALL accept an optional `jupiterTokens?: SwapToken[]` prop. Both mobile (`apps/mobile/app/(app)/(tabs)/swap.tsx`) and extension (`apps/extension/src/pages/swap/SwapPage.tsx`) SHALL load the Jupiter token list and pass it through this prop.

#### Scenario: Both platforms provide Jupiter tokens
- **WHEN** the swap page loads on mobile or extension
- **THEN** `getTokenList()` SHALL be called with the active Solana network ID
- **AND** results SHALL be mapped via `mapToSwapToken()` and passed as `jupiterTokens`
