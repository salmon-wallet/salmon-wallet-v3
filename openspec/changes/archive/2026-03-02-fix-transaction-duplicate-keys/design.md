## Context

The `useTransactions` hook in `packages/shared/src/hooks/useTransactions.ts` fetches paginated transaction history. On `loadMore`, line 186 appends new results directly:

```ts
setTransactions((prev) => [...prev, ...newTransactions]);
```

Solana's cursor-based pagination uses `before: signature` and can return boundary transactions that overlap between pages, causing React duplicate key warnings when rendered with `key={transaction.id}`.

## Goals / Non-Goals

**Goals:**
- Deduplicate transactions when appending paginated results in `useTransactions`
- Preserve order (existing transactions first, then new unique ones)

**Non-Goals:**
- Changing the API pagination mechanism
- Deduplicating at the API/transform layer
- Handling duplicate transactions from different sources (only pagination overlap)

## Decisions

- **Filter in the state updater**: Use a `Set` of existing IDs inside the `setTransactions` callback to filter `newTransactions` before appending. This is O(n) and requires no external state.
- **ID-based deduplication**: Use `transaction.id` (which maps to the Solana signature) as the unique key — the same field used for React keys.
- **Single location fix**: Only modify the `loadMore` append path (line 186). The initial fetch (`replace`) path is fine since it overwrites entirely.

## Risks / Trade-offs

- **Minimal risk**: The Set-based filter is straightforward and only affects the append path.
- **Edge case**: If the API returns an entirely duplicate page (all IDs already seen), the user would see no new items but `hasMore` might still be true. This is acceptable — the next load would advance the cursor past the overlap.
