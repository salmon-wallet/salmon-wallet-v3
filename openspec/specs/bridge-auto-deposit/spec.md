# bridge-auto-deposit Specification

## Purpose

Define the auto-deposit step that completes a bridge after a StealthEx exchange is created. The wallet must transfer the input tokens to the exchange's `depositAddress` using the active blockchain account, surface failures (e.g., insufficient gas) instead of falsely succeeding, and expose the deposit transaction ID on the success screen. The `SwapScreenProps.onSendDeposit` callback is the shared contract every platform implements via `activeBlockchainAccount.transfer()`.

## Requirements

### Requirement: Wallet sends deposit to StealthEx after exchange creation

After `onCreateBridgeExchange` succeeds, the wallet SHALL automatically transfer the input tokens to the exchange's `depositAddress` using the existing `BlockchainAccount.transfer()` method. The transfer SHALL use the input token's mint address, the amount from `inAmount`, and the `depositAddress` from the exchange response.

#### Scenario: Successful bridge with auto-deposit (Solana USDC → BTC)
- **WHEN** user confirms a bridge of 33 USDC to BTC and the exchange is created successfully
- **THEN** the wallet SHALL send 33 USDC to the exchange's `depositAddress` on Solana
- **AND** the success screen SHALL display the deposit transaction ID

#### Scenario: Exchange created but deposit transfer fails
- **WHEN** the exchange is created but the token transfer to `depositAddress` fails (e.g., insufficient SOL for fees)
- **THEN** the wallet SHALL show an error to the user
- **AND** the wallet SHALL NOT show the success screen

### Requirement: SwapScreenProps includes onSendDeposit callback

The `SwapScreenProps` type SHALL include an `onSendDeposit` callback with signature `(depositAddress: string, tokenAddress: string, amount: number) => Promise<{ txId: string }>`. Each platform's SwapPage SHALL implement this callback using `activeBlockchainAccount.transfer()`.

#### Scenario: Extension SwapPage provides onSendDeposit
- **WHEN** SwapScreen is rendered in the extension
- **THEN** `onSendDeposit` SHALL call `activeBlockchainAccount.transfer(depositAddress, tokenAddress, amount)`

#### Scenario: Mobile SwapPage provides onSendDeposit
- **WHEN** SwapScreen is rendered in mobile
- **THEN** `onSendDeposit` SHALL call `activeBlockchainAccount.transfer(depositAddress, tokenAddress, amount)`

### Requirement: Success screen shows deposit transaction ID

The success screen SHALL display the on-chain deposit transaction ID when a bridge deposit was executed. This is in addition to the existing exchange info (deposit address, amounts, exchange ID).

#### Scenario: Bridge success shows deposit txId
- **WHEN** a bridge completes with auto-deposit
- **THEN** the success screen SHALL show the deposit transaction signature as a clickable explorer link
