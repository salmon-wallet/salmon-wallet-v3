# Proposal: Fix remaining account-switch data staleness

## Problem

After commit `712682e` fixed `useBalance` cache keying and added `switchingNetwork` skeletons for blockchain carousel switches, two gaps remain:

1. **`changeAccount` does not activate `switchingNetwork`**: When switching wallets (Account A → Account B) from the header or settings, the `switchingNetwork` flag is not set. The `useBalance` hook resets correctly (via `prevAccountKeyRef`), but UI code that explicitly checks `switchingNetwork` to show empty token lists and skeleton states won't trigger.

2. **`useAvatarNfts` never resets on account change**: The `fetched` flag is set to `true` after the first NFT fetch and never resets when the `account` prop changes. If a user opens the avatar picker on Account A, then switches to Account B, they see Account A's NFTs.

## Solution

1. Add `setSwitchingNetwork(true)` inside `changeAccount` (same pattern as `changeNetwork`).
2. In `useAvatarNfts`, track the previous account ID and reset `fetched`+`nfts` when it changes.

## Scope

- `packages/shared/src/hooks/useAccounts.ts` — `changeAccount` function
- `packages/shared/src/hooks/useAvatarNfts.ts` — account change detection
