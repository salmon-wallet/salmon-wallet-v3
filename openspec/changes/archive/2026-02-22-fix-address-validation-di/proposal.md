## Why

`useAddressValidation` hook directly imports `validateSolanaAddress` and `validateEthereumAddress` from blockchain modules, bypassing account DI. All three account classes already expose `validateDestinationAccount()` — the hook should use it.

## What Changes

- Remove direct imports of `validateDestinationAccount` from `blockchain/solana` and `validateEthereumDestinationAccount` from `blockchain/ethereum` in `useAddressValidation.ts`
- Accept an `account` parameter and call `account.validateDestinationAccount(address)` for all chains
- Bitcoin validation already works via `BitcoinAccount.validateDestinationAccount()` so this unifies the pattern

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this is a pure internal refactor, no behavior change.

## Impact

- `packages/shared/src/hooks/useAddressValidation.ts` — refactored to use account DI
- Callers of `useAddressValidation` in mobile and extension — need to pass `account` param
