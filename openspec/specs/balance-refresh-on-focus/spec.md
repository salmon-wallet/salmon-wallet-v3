# balance-refresh-on-focus Specification

## Purpose

Define when and how wallet data (balance, NFTs, transactions) refreshes in
response to user-visible state changes. After the React Query migration
(`refactor/wallet-react-query`), focus-driven refresh is no longer carried by
the bespoke `useRefreshOnFocus.{native,web}.ts` hooks (deleted) — it is a
default behavior of the shared React Query client. Mutation-driven refresh
(post-send, post-swap, post-burn, post-dApp-approval) is centralized in the
`useInvalidateAfterTx` hook.

Reference files:
- `packages/shared/src/query/query-client.ts` — global RQ defaults.
- `packages/shared/src/query/keys.ts` — query-key factory shared by all hooks.
- `packages/shared/src/query/invalidation.ts` — `useInvalidateAfterTx` and the
  `InvalidationKind` enum (`balance | nfts | avatar-nfts | transactions`).
- `packages/shared/src/hooks/useBalance.ts` — 15s `staleTime`,
  `refetchOnMount: 'always'`.
- `packages/shared/src/hooks/useTransactions.ts` — 60s `staleTime`.
- `packages/shared/src/hooks/useSolanaNfts.ts`, `useAvatarNfts.ts` — 60s
  `staleTime`.

## Requirements

### Requirement: React Query client refreshes active queries on window/app focus

The shared React Query client created by `createQueryClient()` SHALL set
`refetchOnWindowFocus: true` as the default for all queries. When the app
window or tab regains focus, every active query (balance, NFTs, transactions,
avatar NFTs) whose data is older than its per-hook `staleTime` SHALL be
re-fetched automatically. No bespoke focus listener is required.

#### Scenario: Mobile returns from background with stale balance

- **WHEN** the mobile app transitions from background to active state
- **AND** the active balance query was last fetched more than its `staleTime`
  (15s) ago
- **THEN** React Query SHALL re-fetch the balance query and any other active
  queries past their `staleTime`

#### Scenario: Mobile returns from background within the stale window

- **WHEN** the mobile app transitions from background to active state
- **AND** all active queries are within their `staleTime`
- **THEN** React Query SHALL NOT re-fetch on focus

#### Scenario: Extension tab becomes visible with stale data

- **WHEN** the extension popup or side panel becomes visible (`visibilitychange`)
- **AND** the active query is past its `staleTime`
- **THEN** React Query SHALL re-fetch the query automatically

#### Scenario: Inactive query is not refreshed

- **WHEN** the app regains focus
- **AND** a query was previously active but no consumer is subscribed at the
  moment of focus
- **THEN** React Query SHALL NOT re-fetch that inactive query (it will refetch
  on its next mount per `refetchOnMount: 'always'` for balance, or per the
  per-hook policy)

### Requirement: Balance query refetches on every mount regardless of staleness

`useBalance` SHALL set `refetchOnMount: 'always'` so that any screen mounting
a balance consumer triggers an immediate fetch. This covers the swap-MAX use
case where the user jumps from home to swap and the swap screen needs the
freshest balance even within the 15s `staleTime` window.

#### Scenario: User opens swap screen within 15s of last balance fetch

- **WHEN** a balance fetch completed less than 15s ago (data still fresh)
- **AND** the user opens the swap screen, mounting a new `useBalance` consumer
- **THEN** the system SHALL re-fetch the balance immediately (background
  refetch) so MAX reflects the latest amount

### Requirement: Per-hook stale times reflect data volatility

Each data hook SHALL declare its own `staleTime` consistent with how quickly
the data changes on chain, and MUST keep the current values: balance 15
seconds; transactions 60 seconds; NFTs and avatar NFTs 60 seconds. These
values are encoded inline in `useBalance.ts`, `useTransactions.ts`,
`useSolanaNfts.ts`, and `useAvatarNfts.ts`. Changing them MUST update this
spec.

#### Scenario: Balance staleTime is 15 seconds

- **WHEN** a consumer reads `useBalance` 14 seconds after the last successful
  fetch
- **THEN** the cached data SHALL be returned without a background refetch
  (focus-driven and mount-driven refetches still apply per their requirements)

#### Scenario: Transactions and NFT staleTime is 60 seconds

- **WHEN** a consumer reads `useTransactions`, `useSolanaNfts`, or
  `useAvatarNfts` within 60 seconds of the last successful fetch
- **THEN** the cached data SHALL be returned without a background refetch

### Requirement: Mutations invalidate the queries they affect

The system SHALL route all post-mutation invalidation through the shared
hook `useInvalidateAfterTx` (in `packages/shared/src/query/invalidation.ts`),
which MUST be the single entry point for invalidating wallet data after a
state-changing operation. Consumers pass `{ accountId, networkId, kinds }`
where `kinds` is a subset of `'balance' | 'nfts' | 'avatar-nfts' | 'transactions'`.

#### Scenario: User completes a token send

- **WHEN** a token transfer succeeds
- **THEN** the calling code SHALL invoke `useInvalidateAfterTx` with kinds
  `['balance', 'transactions']` for the active `accountId` + `networkId`

#### Scenario: User completes a swap

- **WHEN** a swap completes successfully
- **THEN** the calling code SHALL invoke `useInvalidateAfterTx` with kinds
  `['balance', 'transactions']`

#### Scenario: User burns or sends an NFT

- **WHEN** an NFT burn or transfer succeeds
- **THEN** the calling code SHALL invoke `useInvalidateAfterTx` with kinds
  `['balance', 'nfts', 'transactions']` (and `'avatar-nfts'` if the burned NFT
  is the configured avatar)

#### Scenario: User approves a dApp transaction or message-signing request

- **WHEN** a dApp `signTransaction`, `signAllTransactions`, `signAndSendTransaction`,
  or `sign` approval succeeds
- **THEN** the approval handler SHALL invoke `useInvalidateAfterTx` with kinds
  `['balance', 'transactions']`

#### Scenario: User denies a dApp request

- **WHEN** a dApp request is denied
- **THEN** the system SHALL NOT invoke `useInvalidateAfterTx` (no on-chain
  state changed)

#### Scenario: User approves a dApp connect request

- **WHEN** a dApp `connect` approval completes
- **THEN** the system SHALL NOT invoke `useInvalidateAfterTx` (connecting does
  not change on-chain state)

### Requirement: Targeted invalidation by account and network

`useInvalidateAfterTx` SHALL only invalidate query keys whose `accountId` and
`networkId` parameters match the caller's options. This prevents collateral
refetches across other accounts and networks held in cache.

#### Scenario: Two accounts cached, mutation on account A

- **WHEN** the user performs a transaction on account A on `solana-mainnet`
- **AND** account B's balance is also cached from a previous render
- **THEN** invoking `useInvalidateAfterTx({ accountId: 'A', networkId: 'solana-mainnet', kinds: ['balance'] })`
  SHALL only invalidate keys with `accountId === 'A'` and `networkId === 'solana-mainnet'`

### Requirement: Manual refresh remains available on the extension

The extension SHALL continue to display a refresh button in `WalletHeader`
that triggers an immediate refetch of the active balance query. Mobile SHALL
continue to support pull-to-refresh; the mobile header SHALL NOT show a
refresh button.

#### Scenario: Refresh button visible on extension home

- **WHEN** the extension home page is displayed
- **THEN** a refresh icon button SHALL be visible in the header action area

#### Scenario: User taps the extension refresh button

- **WHEN** the user clicks the refresh button
- **THEN** the system SHALL trigger a balance refetch (e.g. by calling
  `queryClient.invalidateQueries` for the balance prefix or by toggling a
  consumer-level refetch)

#### Scenario: Refresh button shows loading state

- **WHEN** a balance refetch is in flight
- **THEN** the refresh icon SHALL display a spinning animation

#### Scenario: Mobile header shows no refresh button

- **WHEN** the mobile home screen is displayed
- **THEN** the header SHALL NOT display a refresh button (mobile uses
  pull-to-refresh)
