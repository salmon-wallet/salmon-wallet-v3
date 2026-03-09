## Why

When the user toggles "Developer Networks" in Settings, the carousel pagination dots don't update immediately. The dots only refresh after swiping to another card, because `useAvailableNetworks` maintains its own internal `useUserConfig` instance that is disconnected from the one in HomePage. The toggle updates instance #1's local state, but instance #2 (inside `useAvailableNetworks`) only re-reads from storage when its `[blockchain, environment]` dependencies change — which doesn't happen on a toggle.

## What Changes

- Refactor `useAvailableNetworks` to accept `developerNetworks` as a direct parameter instead of calling `useUserConfig` internally, eliminating the dual-instance desync
- Update all consumers of `useAvailableNetworks` (web, extension, mobile HomePages) to pass `developerNetworks` from their existing `useUserConfig` call
- Remove the redundant `useUserConfig` call inside `useAvailableNetworks`

## Capabilities

### New Capabilities

- `developer-networks-toggle-sync`: Immediate propagation of the developer networks toggle to the carousel/dots without requiring a swipe or navigation event

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **`packages/shared/src/hooks/useAvailableNetworks.ts`** — API signature change: accepts `developerNetworks: boolean` instead of `UseUserConfigParams`. Removes internal `useUserConfig` dependency.
- **`packages/shared/src/hooks/useUserConfig.ts`** — No changes needed, but its `developerNetworks` value is now the single source of truth passed through.
- **`apps/web/src/pages/home/HomePage.tsx`** — Update `useAvailableNetworks` call to pass `developerNetworks` from existing `useUserConfig`.
- **`apps/extension/src/pages/home/HomePage.tsx`** — Same update.
- **`apps/mobile/app/(app)/(tabs)/index.tsx`** — Same update.
- Any other consumer of `useAvailableNetworks` must be updated to pass `developerNetworks`.
