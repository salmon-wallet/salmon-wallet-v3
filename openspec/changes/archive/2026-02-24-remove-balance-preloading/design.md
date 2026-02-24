## Context

The HomePage (extension and mobile) calls `useBalance` three times: once for the active blockchain, and once each for the previous/next adjacent blockchains via `useAdjacentBalances`. The intent was to preload adjacent data for smooth carousel transitions. However, each `useBalance` instance has its own isolated `cacheRef`, so preloaded data is never reused when the user swipes — the active hook always re-fetches. This results in wasted API calls with zero UX benefit.

## Goals / Non-Goals

**Goals:**
- Eliminate unnecessary balance API calls for non-active blockchains
- Reduce API calls from 2-3 per mount/swipe to exactly 1
- Remove dead code (`useAdjacentBalances` hook) that no longer serves a purpose
- Maintain the existing skeleton/loading UX during blockchain switches (unchanged)

**Non-Goals:**
- Implementing a shared/global balance cache (out of scope — the 60s per-instance cache is sufficient)
- Changing the BalanceCardCarousel visual behavior or animation
- Modifying the `useBalance` hook internals
- Adding any new preloading strategy

## Decisions

1. **Delete `useAdjacentBalances` entirely** rather than refactoring it. The hook's only purpose was to provide accounts for preloading. No other consumer exists.

2. **Keep one `useBalance` call per HomePage** — only for the active blockchain account. The `blockchainBalances` memo will provide `undefined` values for non-active networks, which the BalanceCardCarousel already handles gracefully (shows no data / skeleton on swipe).

3. **No shared cache layer needed**. Balance fetches complete in ~300ms. The small delay on swipe is acceptable and the user already sees skeleton states during that time (via the existing `switchingNetwork` flag).

4. **Simplify `blockchainBalances` memo** — remove all prev/next balance variables. Only the active network entry gets real balance data; all others get `undefined` with `loading: false`.

## Risks / Trade-offs

- **Slightly slower perceived swipe transition**: Adjacent cards won't have data ready when swiped to. Mitigated by the existing skeleton UX during `switchingNetwork`, and the fast fetch time (~300ms).
- **No regression risk on skeleton behavior**: The `switchingNetwork` flag and skeleton logic are completely independent of the preloading mechanism and remain untouched.
