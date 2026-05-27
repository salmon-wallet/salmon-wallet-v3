## Why

The swap receive-token list ignores the blockchain feature flag (`ENABLED_BLOCKCHAINS`). With Ethereum disabled, users still see ETH and ethbase as swap destinations. Additionally, `SUPPORTED_CHAINS` in `utils/swap.ts` is a hardcoded constant that duplicates—and contradicts—the canonical `ENABLED_BLOCKCHAINS` from `config/blockchains.ts`. The `getChainFromNetwork` mapper also lacks mappings for the lowercase network identifiers (`"sol"`, `"eth"`) that StealthEx actually returns, which will matter once the backend bug is fixed and 72+ Solana SPL tokens start flowing through.

## What Changes

- **Remove `SUPPORTED_CHAINS` constant** from `utils/swap.ts` and replace all usages with `ENABLED_BLOCKCHAINS` from `config/blockchains.ts`, so swap filtering is driven by the same feature flag as the rest of the wallet.
- **Update `getChainFromNetwork`** to handle StealthEx's lowercase network strings (`"sol"` → `'solana'`, `"eth"` → `'ethereum'`, `"btc"` / `"bitcoin"` → `'bitcoin'`) in addition to the existing null-network symbol-based fallback.
- **Filter `availableOutTokens`** in `useSwapScreenLogic.ts` through `isBlockchainEnabled()` so disabled chains never appear as receive options (both in the bridge token loader and in the `outputTokens` memo).

## Capabilities

### New Capabilities

- `swap-chain-filter`: Swap receive-token list respects the blockchain feature flag and correctly maps StealthEx network identifiers to wallet chain types.

### Modified Capabilities

_(none — no existing spec requirements change)_

## Impact

- **`packages/shared/src/utils/swap.ts`** — Remove `SUPPORTED_CHAINS`, update `getChainFromNetwork`, update barrel export.
- **`packages/shared/src/hooks/useSwapScreenLogic.ts`** — Import `isBlockchainEnabled` instead of `SUPPORTED_CHAINS`; use it in bridge token loader and `outputTokens` memo.
- **`packages/shared/src/utils/index.ts`** — Remove `SUPPORTED_CHAINS` re-export if present.
- **Both `apps/mobile` and `apps/extension`** — No direct changes; they consume the shared hook.
- **No API or backend changes** (backend StealthEx case-mismatch is a separate fix outside this repo).
