# Spec: Account switch data reset

## `changeAccount` must activate switchingNetwork

- `changeAccount` in `useAccounts.ts` must call `setSwitchingNetwork(true)` before `setAccountId`
- This ensures all UI that depends on `switchingNetwork` (token lists, balance cards) shows skeletons
- The flag is cleared by the existing `clearSwitchingNetwork` effect once `useBalance` finishes loading

## `useAvatarNfts` must reset on account change

- Track previous account ID via `useRef`
- When account ID changes, reset `fetched` to `false` and `nfts` to `[]`
- Use `account?.id` as the identity key (same Account type already has `id`)
