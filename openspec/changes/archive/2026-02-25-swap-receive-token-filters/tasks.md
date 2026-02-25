## 1. Remove SUPPORTED_CHAINS constant

- [x] 1.1 Delete the `SUPPORTED_CHAINS` export from `packages/shared/src/utils/swap.ts` (line 51)
- [x] 1.2 Remove the `SUPPORTED_CHAINS` re-export from `packages/shared/src/utils/index.ts` (line 219)

## 2. Wire bridge token filter to feature flag

- [x] 2.1 In `packages/shared/src/hooks/useSwapScreenLogic.ts`, replace the `SUPPORTED_CHAINS` import with `isBlockchainEnabled` from `../config/blockchains` and `BlockchainType` from `../types/blockchain`
- [x] 2.2 Replace the filter on line 227 (`if (!chain || !SUPPORTED_CHAINS.includes(chain)) continue;`) with `if (!chain || !isBlockchainEnabled(chain as BlockchainType)) continue;`

## 3. Verify

- [x] 3.1 Run `pnpm turbo run typecheck --filter=@salmon/shared` and confirm zero errors
- [x] 3.2 Grep the entire repo for `SUPPORTED_CHAINS` and confirm zero results
