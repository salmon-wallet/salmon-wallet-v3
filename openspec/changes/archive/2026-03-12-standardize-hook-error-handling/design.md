## Approach

Additive-only changes to existing hook return types. No new abstractions or wrapper types — each hook adds the missing fields inline.

### Error type normalization

All hooks standardize on `error: string | null` (not `Error | null`). Rationale: UI consumers only need the message string. Hooks that currently store `Error` objects (`useBalance`, `useToken`) will store `err.message` instead.

### `isError` derivation

Every hook that exposes `error` also exposes `isError: boolean` as a computed value:
```ts
const isError = error !== null;
```
This is NOT stored in state — it's derived inline in the return object.

### Tier A — Mutation hooks contract

```ts
interface MutationHookResult {
  error: string | null;
  isError: boolean;
  reset: () => void;
  status: SomeStatusEnum; // hook-specific
}
```

**useAccounts**: Special case. Currently returns `[State, Actions]` tuple. Add `error: string | null` and `isError: boolean` to `UseAccountsState`. Add `resetError: () => void` to `UseAccountsActions`. Functions like `unlock()`, `createWallet()` that currently return `boolean` will also set `error` state on failure (in addition to returning false).

**useBridge, useSwap, useSendTransaction, useNftTransfer**: Already have `error`, `reset()`, and `status`. Only add `isError: boolean` to their return type interfaces.

### Tier B — Read hooks contract

```ts
interface ReadHookResult {
  error: string | null;
  isError: boolean;
  isLoading: boolean; // already exists in most
}
```

**useBalance**: Change `error` from `Error | null` to `string | null`. Add `isError`. Keep `loading` name (aliased as `isLoading` would be breaking — just add `isError`).

**useToken**: Change `error` from `Error | null` to `string | null`. Add `isError`.

**useTransactions**: Already has `error: string | null`. Add `isError`.

**useMultiChainTokens**: Keep `errors: Record<ChainType, string | null>` (changing from `Error | null` to `string | null`). Add `hasErrors: boolean` (derived: `Object.values(errors).some(e => e !== null)`).

**useAddressbook**: Add `error: string | null` and `isError: boolean` to `UseAddressbookState`. Surface errors from storage operations.

**useAvatarNfts**: Add `error: string | null` and `isError: boolean` to return type.

**useTokenSearch**: Add `error: string | null` and `isError: boolean` to return type.

### Tier C — No changes

useLanguage, useUserConfig, useAvailableNetworks, useInactivityTimeout, useSettingsPanelStack, useOpenLink, useRuntime, useAddressValidation, useAddressBookForm, useSendContacts — no changes.

## Key Decisions

- **No generic `HookResult<T>`**: Each hook defines its own interface. A generic wrapper would add indirection without real benefit since each hook has unique fields.
- **`string | null` over `Error | null`**: Simpler for consumers, consistent across all hooks. The Error stack trace is only useful for logging (which happens at catch site anyway).
- **`isError` is always derived, never stored**: Prevents state desync between `error` and `isError`.
- **Backwards compatible**: All changes are additive fields. No fields renamed or removed. No return type shape changes.
- **`loading` naming kept as-is**: Some hooks use `loading`, others `isLoading`. This change does NOT normalize loading field names to avoid breaking consumers. That's a separate concern.

## Risks

- **useAccounts tuple shape**: Adding fields to the state object in a `[State, Actions]` tuple is non-breaking since consumers destructure the objects.
- **Error type change** (`Error` → `string`): Any consumer doing `error.message` or `error.stack` will break. Need to search for these patterns in mobile/extension/web before implementing.
