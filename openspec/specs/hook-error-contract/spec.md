# hook-error-contract

Standard error handling contract for hooks in `packages/shared/src/hooks/`.

## Requirements

### Mutation hooks (Tier A)

`useBridge`, `useSwap`, `useSendTransaction`, `useNftTransfer` return types SHALL include:
- `error: string | null` — human-readable error message, null when no error
- `isError: boolean` — derived as `error !== null`, never stored in state
- `reset: () => void` — clears error and resets status to idle
- `status: <HookSpecificStatus>` — hook-specific status enum (already exists)

`useAccounts` state (`UseAccountsState`) SHALL include:
- `error: string | null`
- `isError: boolean`

`useAccounts` actions (`UseAccountsActions`) SHALL include:
- `resetError: () => void`

### Read hooks (Tier B)

`useBalance`, `useToken`, `useTransactions` return types SHALL include:
- `error: string | null` (NOT `Error | null`)
- `isError: boolean` — derived as `error !== null`

`useAddressbook` state (`UseAddressbookState`), `useAvatarNfts` result (`UseAvatarNftsResult`), and `useTokenSearch` result (`UseTokenSearchResult`) SHALL include:
- `error: string | null`
- `isError: boolean`

`useMultiChainTokens` result SHALL include:
- `errors: Record<ChainType, string | null>` (NOT `Error | null`)
- `hasErrors: boolean` — derived as `Object.values(errors).some(e => e !== null)`

### Infrastructure hooks (Tier C) — No requirements

useLanguage, useUserConfig, useAvailableNetworks, useInactivityTimeout, useSettingsPanelStack, useOpenLink, useRuntime, useAddressValidation, useAddressBookForm, useSendContacts SHALL NOT be modified.

### General constraints

- `isError` and `hasErrors` SHALL be computed inline in the return object, never stored in React state.
- All error values SHALL be `string | null`, not `Error | null`.
- All changes SHALL be additive — no existing fields removed or renamed.
- Hooks that currently swallow errors (catch + console.error) SHALL now also set error state before logging.
