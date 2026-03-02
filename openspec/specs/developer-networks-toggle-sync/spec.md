## Overview

When the user toggles "Developer Networks" in Settings, the carousel pagination dots and network list must update immediately — without requiring a swipe or page reload.

## Requirements

### REQ-1: Optional `developerNetworks` override in `useAvailableNetworks`

- The hook's params interface MUST accept an optional `developerNetworks?: boolean` field
- When provided, the hook MUST use this value instead of the one from its internal `useUserConfig`
- When omitted, the hook MUST fall back to the internal `useUserConfig` value (existing behavior)
- The internal `useUserConfig` call MUST remain (React hook rules — cannot conditionally call hooks)

### REQ-2: HomePage callers pass the override

- `apps/web/src/pages/home/HomePage.tsx` MUST pass `developerNetworks` from its own `useUserConfig` to `useAvailableNetworks`
- `apps/extension/src/pages/home/HomePage.tsx` MUST do the same
- `apps/mobile/app/(app)/(tabs)/index.tsx` MUST do the same

### REQ-3: Non-HomePage callers unchanged

- `packages/shared/src/hooks/useSendContacts.ts` — no change
- `apps/mobile/.../settings/address-book.tsx` — no change
- `apps/mobile/.../settings/address-book-add.tsx` — no change
- `apps/mobile/.../settings/address-book-edit.tsx` — no change
- `apps/mobile/.../settings/network.tsx` — no change

### REQ-4: Return type backward compatible

- `UseAvailableNetworksResult.developerNetworks` MUST remain in the return type
- The returned value MUST reflect the effective value (override ?? internal)

### REQ-5: Immediate UI update

- After toggling developer networks in Settings, the carousel dot count MUST change within the same React render cycle (no swipe, no page reload required)
- The `allNetworks` array MUST grow/shrink immediately when `developerNetworks` changes
