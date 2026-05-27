# hook-error-contract Specification

## Purpose

Define the standard error-handling contract for hooks in `packages/shared/src/hooks/`. Mutation hooks (Tier A) expose `error`, `isError`, `reset`, and `status`; read hooks (Tier B) expose `error` and `isError` (or `errors`/`hasErrors` for multi-chain results); infrastructure hooks (Tier C) stay untouched. All error values are `string | null`, `isError`/`hasErrors` are derived inline rather than stored, changes are additive, and hooks that previously swallowed errors must set error state before logging.

## Requirements

### Requirement: Mutation hooks expose error, isError, reset, and status

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

#### Scenario: Mutation hook surfaces error and supports reset

- **WHEN** a mutation in `useBridge`, `useSwap`, `useSendTransaction`, or `useNftTransfer` fails
- **THEN** the hook return value SHALL expose `error` as the human-readable message, `isError` as `true`, and `reset` SHALL clear the error and return status to idle

#### Scenario: useAccounts exposes error state and resetError action

- **WHEN** an action on `useAccounts` fails
- **THEN** `UseAccountsState` SHALL expose `error: string | null` and `isError: boolean`, and `UseAccountsActions.resetError()` SHALL clear them

### Requirement: Read hooks expose error and isError

`useBalance`, `useToken`, `useTransactions` return types SHALL include:
- `error: string | null` (NOT `Error | null`)
- `isError: boolean` — derived as `error !== null`

`useAddressbook` state (`UseAddressbookState`), `useAvatarNfts` result (`UseAvatarNftsResult`), and `useTokenSearch` result (`UseTokenSearchResult`) SHALL include:
- `error: string | null`
- `isError: boolean`

`useMultiChainTokens` result SHALL include:
- `errors: Record<ChainType, string | null>` (NOT `Error | null`)
- `hasErrors: boolean` — derived as `Object.values(errors).some(e => e !== null)`

#### Scenario: Read hook surfaces error string

- **WHEN** a fetch in `useBalance`, `useToken`, `useTransactions`, `useAddressbook`, `useAvatarNfts`, or `useTokenSearch` fails
- **THEN** the hook return value SHALL expose `error: string | null` and `isError: boolean` derived from `error !== null`

#### Scenario: useMultiChainTokens reports per-chain errors

- **WHEN** any chain in `useMultiChainTokens` fails
- **THEN** the result SHALL expose `errors: Record<ChainType, string | null>` and `hasErrors` derived as `Object.values(errors).some(e => e !== null)`

### Requirement: Infrastructure hooks are not modified

`useLanguage`, `useUserConfig`, `useAvailableNetworks`, `useInactivityTimeout`, `useSettingsPanelStack`, `useOpenLink`, `useRuntime`, `useAddressValidation`, `useAddressBookForm`, and `useSendContacts` SHALL NOT be modified by this contract.

#### Scenario: Tier C hooks unchanged

- **WHEN** reviewing the listed Tier C hooks
- **THEN** their return shapes SHALL remain identical to their pre-contract definitions

### Requirement: General error-contract constraints

- `isError` and `hasErrors` SHALL be computed inline in the return object, never stored in React state.
- All error values SHALL be `string | null`, not `Error | null`.
- All changes SHALL be additive — no existing fields removed or renamed.
- Hooks that currently swallow errors (catch + console.error) SHALL now also set error state before logging.

#### Scenario: isError is derived inline

- **WHEN** a hook constructs its return object
- **THEN** `isError` (or `hasErrors`) SHALL be computed inline from the error value and SHALL NOT be stored in `useState`

#### Scenario: Caught errors update error state before logging

- **WHEN** a hook catches an error it previously only logged via `console.error`
- **THEN** the hook SHALL also set its `error` state to a `string` message before logging
