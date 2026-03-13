## Why

Hook error handling in `packages/shared/src/hooks/` is inconsistent: mutation hooks partially expose errors while most read hooks silently swallow them (`console.error` only). Consumers cannot reliably detect or display errors, and there is no standard contract for error fields across hooks. This makes error UX unpredictable and debugging harder.

## What Changes

- **Tier A — Mutation hooks** (useAccounts, useBridge, useSwap, useSendTransaction, useNftTransfer): Standardize to `{ error: string | null, isError: boolean, reset(), status }`. useAccounts needs the most work (currently swallows all errors). The other 4 already have error+reset+status — only `isError` boolean is missing.
- **Tier B — Read hooks with data** (useBalance, useToken, useTransactions, useMultiChainTokens, useTokenSearch, useAddressbook, useAvatarNfts): Standardize to `{ error: string | null, isError: boolean, isLoading: boolean }`. Normalize error type to `string | null` (useBalance/useToken currently use `Error | null`). Surface errors in hooks that currently swallow them (useAddressbook, useAvatarNfts, useTokenSearch).
- **Tier C — Infrastructure hooks** (useLanguage, useUserConfig, useAvailableNetworks, useInactivityTimeout, useSettingsPanelStack, useOpenLink, useRuntime, useAddressValidation, useAddressBookForm, useSendContacts): **No changes**. Silent fallbacks are correct for these.
- All changes are **additive** — new fields added to existing return types, no fields removed.

## Capabilities

### New Capabilities
- `hook-error-contract`: Defines the standard error handling contract for mutation and read hooks in packages/shared

### Modified Capabilities
<!-- None — this is an internal consistency improvement, no existing spec requirements change -->

## Impact

- **packages/shared/src/hooks/**: 12 hook files modified (5 mutation + 7 read)
- **packages/shared/src/hooks/index.ts**: Barrel exports updated for any new types
- **Consumers (mobile, extension, web)**: No breaking changes — all additions are optional new fields on existing return types
- **No new dependencies**
