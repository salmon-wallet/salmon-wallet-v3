## Why

The DI refactor for `SolanaAccount.getBalance()` switched Solana pricing from Jupiter (per-token, matched by mint address) to CoinGecko batch (matched by coingeckoId/symbol). This causes most SPL tokens to lose price data, USD balances, and 24h change — because Ubiquity returns `coingeckoId` only for native SOL, and CoinGecko has limited SPL token coverage. Token metadata (logos) also degraded since Ubiquity+TrustWallet has less coverage than Jupiter V2. The app was working correctly before the refactor; this restores that data quality while keeping the DI architecture.

## What Changes

- Restore Jupiter Price API v3 as the price source for Solana tokens (matched by mint address, not coingeckoId/symbol)
- Enrich Ubiquity balance data with Jupiter V2 token metadata (logos, names) via `/ft/batch?mints=...`
- Add sorting: SOL first, then by USD balance descending
- All changes are frontend-only (`packages/shared`), within the existing DI pattern — no backend modifications

## Capabilities

### New Capabilities

_None — this is a bug fix restoring previous behavior._

### Modified Capabilities

_None — no spec-level requirement changes, only implementation details._

## Impact

- `packages/shared/src/api/services/solana.ts` — DI adapter: `fetchSolanaAccountBalance` will enrich with Jupiter metadata; new `fetchSolanaAccountPrices` will return Jupiter prices instead of CoinGecko
- `packages/shared/src/blockchain/solana/SolanaAccount.ts` — `getBalance()` will use Jupiter price path in `decorateBalancePrices` (third param) and add sorting
- `packages/shared/src/api/services/price.ts` — `getSolanaTokenPrice` and `getJupiterPrices` may need to be restored/exposed
- `packages/shared/src/types/balance.ts` — May need `JupiterApiPriceData` type if not already exported
- `packages/shared/src/utils/balance.ts` — `decorateBalancePrices` already supports Jupiter mode (third param) — no changes needed
- No changes to mobile or extension apps — they consume via `useBalance` hook which calls `account.getBalance()`
- No changes to Bitcoin or Ethereum flows
