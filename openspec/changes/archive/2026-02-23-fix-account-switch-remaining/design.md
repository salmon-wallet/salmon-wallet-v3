# Design: Fix remaining account-switch data staleness

## Change 1: `changeAccount` sets `switchingNetwork`

In `useAccounts.ts`, the `changeAccount` callback should call `setSwitchingNetwork(true)` before updating state, exactly like `changeNetwork` does. The existing `clearSwitchingNetwork` mechanism in mobile and extension HomePages will clear the flag once `useBalance` finishes loading.

No new state or API changes needed — reuses the existing `switchingNetwork` infrastructure.

## Change 2: `useAvatarNfts` resets on account change

Add a `useRef` tracking the previous account ID. When the account changes:
- Reset `fetched` to `false`
- Clear `nfts` to `[]`

This triggers a re-fetch on the next render when `enabled` is true.

## Files to modify

- `packages/shared/src/hooks/useAccounts.ts` — 1 line addition in `changeAccount`
- `packages/shared/src/hooks/useAvatarNfts.ts` — add account tracking ref + reset effect
