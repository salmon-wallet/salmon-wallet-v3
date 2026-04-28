# devnet-balance-display Specification

## Purpose

Ensure devnet/testnet accounts render a usable balance UI even when price APIs return no data: blockchain `getBalance()` methods SHALL return `usdTotal: 0` and `last24HoursChange: 0` instead of omitting the fields, BalanceCard SHALL render `$0.00` / `0.00%`, and token lists SHALL show devnet tokens or the empty state with the correct devnet address in the header.

## Requirements

### Requirement: getBalance MUST return numeric usdTotal when prices are unavailable
The `getBalance()` method in `SolanaAccount` (`packages/shared/src/blockchain/solana/SolanaAccount.ts`), `BitcoinAccount` (`packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts`), and `EthereumAccount` (`packages/shared/src/blockchain/ethereum/EthereumAccount.ts`) SHALL return `usdTotal: 0` and `last24HoursChange: 0` when price APIs (Jupiter, CoinGecko) return no data. The method MUST NOT omit `usdTotal` from the response object.

#### Scenario: Solana devnet account with no Jupiter prices
- **WHEN** `SolanaAccount.getBalance()` is called for a devnet account and Jupiter prices returns an empty map
- **THEN** the returned object SHALL include `usdTotal: 0` and `last24HoursChange: 0` alongside the `items` array

#### Scenario: Bitcoin testnet account with no CoinGecko prices
- **WHEN** `BitcoinAccount.getBalance()` is called for a testnet account and `getPrices()` returns null or undefined
- **THEN** the returned object SHALL include `usdTotal: 0` and `last24HoursChange: 0` alongside the `items` array

#### Scenario: Ethereum Sepolia account with no price data
- **WHEN** `EthereumAccount.getBalance()` is called for a Sepolia account and `getPrices()` returns null or undefined
- **THEN** the returned object SHALL include `usdTotal: 0` and `last24HoursChange: 0` alongside the `items` array

#### Scenario: Mainnet account with valid prices (no regression)
- **WHEN** `getBalance()` is called for a mainnet account and price APIs return valid data
- **THEN** the returned `usdTotal` SHALL be calculated from token balances as before (existing behavior preserved)

### Requirement: BalanceCard MUST display $0.00 for devnet/testnet accounts
The BalanceCard component (`packages/ui/src/components/BalanceCard/BalanceCard.tsx`) SHALL display a formatted zero value (e.g., `$0.00`) when `usdTotal` is `0`. The 24h change row SHALL display `0.00%` with neutral styling.

#### Scenario: Devnet balance card renders zero balance
- **WHEN** the BalanceCard receives `usdTotal: 0`, `changePercent: 0`, `changeAmount: 0` for a Solana Devnet network
- **THEN** the balance SHALL display `$0.00` (or equivalent in user's currency) and the change row SHALL display `0.00%`

### Requirement: Token list MUST show devnet tokens or empty state
On all platforms (web, extension, mobile), when the active network is a devnet/testnet, the token list section SHALL display the tokens returned by `useBalance` for that network's account. If no tokens are returned, the empty state message SHALL be shown.

#### Scenario: Devnet account with SOL balance
- **WHEN** the user is viewing Solana Devnet and the account has native SOL on devnet
- **THEN** the token list SHALL display the SOL token with its devnet balance amount and `$0.00` USD value

#### Scenario: Devnet account with no tokens
- **WHEN** the user is viewing Solana Devnet and the account has no tokens or zero balance
- **THEN** the token list SHALL display the empty state message ("No tokens found")

#### Scenario: Header address matches selected devnet network
- **WHEN** the user is viewing Solana Devnet via the carousel
- **THEN** the header address SHALL display the Solana devnet address (base58 public key), NOT a Bitcoin or Ethereum address
