# developer-networks-toggle-sync Specification

## Purpose

Make the Developer Networks settings toggle update the home carousel and network list within the same React render cycle. `useAvailableNetworks` SHALL accept an optional `developerNetworks` override so HomePage callers can pass their own `useUserConfig` value, while non-HomePage callers and the result shape stay backward compatible.

## Requirements

### Requirement: Optional developerNetworks override in useAvailableNetworks

The `useAvailableNetworks` params interface SHALL accept an optional `developerNetworks?: boolean` field. When provided, the hook MUST use this value instead of the one from its internal `useUserConfig`. When omitted, the hook MUST fall back to the internal `useUserConfig` value (existing behavior). The internal `useUserConfig` call MUST remain because React hook rules forbid conditional hook calls.

#### Scenario: Override provided

- **WHEN** a caller passes `useAvailableNetworks({ developerNetworks: true })`
- **THEN** the hook SHALL use `true` regardless of the internal `useUserConfig` value

#### Scenario: Override omitted

- **WHEN** a caller invokes `useAvailableNetworks()` with no `developerNetworks` field
- **THEN** the hook SHALL fall back to the value returned by its internal `useUserConfig`

### Requirement: HomePage callers pass the override

`apps/web/src/pages/home/HomePage.tsx`, `apps/extension/src/pages/home/HomePage.tsx`, and `apps/mobile/app/(app)/(tabs)/index.tsx` SHALL pass `developerNetworks` from their own `useUserConfig` to `useAvailableNetworks`.

#### Scenario: HomePage forwards developerNetworks

- **WHEN** any of the three HomePage entry points renders
- **THEN** it SHALL read `developerNetworks` from its own `useUserConfig` and pass it as the `developerNetworks` param to `useAvailableNetworks`

### Requirement: Non-HomePage callers unchanged

The following call sites SHALL NOT change: `packages/shared/src/hooks/useSendContacts.ts`, `apps/mobile/.../settings/address-book.tsx`, `apps/mobile/.../settings/address-book-add.tsx`, `apps/mobile/.../settings/address-book-edit.tsx`, and `apps/mobile/.../settings/network.tsx`.

#### Scenario: Non-HomePage call sites untouched

- **WHEN** reviewing the listed non-HomePage callers
- **THEN** their invocation of `useAvailableNetworks` SHALL be identical to the pre-change call

### Requirement: Return type backward compatible

`UseAvailableNetworksResult.developerNetworks` SHALL remain in the return type, and the returned value MUST reflect the effective value (`override ?? internal`).

#### Scenario: Returned developerNetworks reflects effective value

- **WHEN** a caller passes `developerNetworks: true` while internal `useUserConfig` resolves to `false`
- **THEN** `UseAvailableNetworksResult.developerNetworks` SHALL be `true`

### Requirement: Immediate UI update

After toggling developer networks in Settings, the carousel dot count MUST change within the same React render cycle (no swipe, no page reload required), and the `allNetworks` array MUST grow or shrink immediately when `developerNetworks` changes.

#### Scenario: Carousel updates without reload

- **WHEN** the user toggles Developer Networks in Settings
- **THEN** the carousel pagination dot count and `allNetworks` array SHALL update within the same React render cycle without requiring a swipe or page reload
