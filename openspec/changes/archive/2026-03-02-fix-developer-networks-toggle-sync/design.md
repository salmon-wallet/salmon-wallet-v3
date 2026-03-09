## Problem

`useAvailableNetworks` internally calls `useUserConfig`, creating a second independent instance. When HomePage toggles `developerNetworks` via its own `useUserConfig`, the instance inside `useAvailableNetworks` retains the stale value until its `[blockchain, environment]` deps change (i.e., on swipe).

## Design Decision: Optional Override Parameter

Add an optional `developerNetworks` override to the existing params interface. When provided, the hook uses the override instead of its internal `useUserConfig` value. The internal `useUserConfig` call remains (React hook rules forbid conditional calls) but its `developerNetworks` value is ignored when the override is present.

### Why not remove `useUserConfig` from inside `useAvailableNetworks`?

5 consumers don't have their own `useUserConfig` (address-book screens, network settings, `useSendContacts`). They rely on the hook's internal call to determine `developerNetworks`. Removing it would break them.

### New API

```typescript
export interface UseAvailableNetworksParams extends UseUserConfigParams {
  /** Override developerNetworks value (bypasses internal useUserConfig read) */
  developerNetworks?: boolean;
}

export function useAvailableNetworks(params: UseAvailableNetworksParams) {
  const config = useUserConfig(params);
  const devNets = params.developerNetworks ?? config.developerNetworks;
  // networks useMemo uses devNets instead of config.developerNetworks
  ...
}
```

### Backward compatibility

- All existing callers continue working unchanged (no `developerNetworks` passed → falls back to internal `useUserConfig`)
- Only the 3 HomePage callers add the override to get instant sync

## Consumers to update

| File | Has own `useUserConfig`? | Action |
|------|--------------------------|--------|
| `apps/web/src/pages/home/HomePage.tsx` | Yes | Pass `developerNetworks` override |
| `apps/extension/src/pages/home/HomePage.tsx` | Yes | Pass `developerNetworks` override |
| `apps/mobile/app/(app)/(tabs)/index.tsx` | Yes | Pass `developerNetworks` override |
| `packages/shared/src/hooks/useSendContacts.ts` | No | No change needed |
| `apps/mobile/.../settings/address-book.tsx` | No | No change needed |
| `apps/mobile/.../settings/address-book-add.tsx` | No | No change needed |
| `apps/mobile/.../settings/address-book-edit.tsx` | No | No change needed |
| `apps/mobile/.../settings/network.tsx` | No | No change needed |

## Return type change

Remove `developerNetworks` from `UseAvailableNetworksResult` — it was only there because the hook owned that state. Callers that need it should use their own `useUserConfig`. (Check if any consumer reads it from the hook's return first.)

Actually, keep `developerNetworks` in the return type for backward compatibility — non-HomePage callers may rely on it. The returned value should reflect the effective value (override ?? internal).
