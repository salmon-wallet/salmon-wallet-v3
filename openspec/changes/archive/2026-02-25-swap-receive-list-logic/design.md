## Context

When the user selects a Solana token as swap input, the receive-token list currently shows only user-held Solana balance tokens (from `useMultiChainTokens`) plus bridge tokens. This is limited — users can't see the full Jupiter catalog without manually searching. Additionally, the 72 StealthEx Solana SPL tokens are redundant because Jupiter handles same-chain swaps faster and with more options.

The existing `getTokenList()` in `packages/shared/src/api/services/tokens.ts` already fetches the full Jupiter verified token list with a 5-minute smart cache. The `mapToSwapToken()` utility converts `TokenMetadata` → `SwapToken`. Both are ready to use.

## Goals / Non-Goals

**Goals:**
- When input is Solana: show full Jupiter verified token catalog + only cross-chain StealthEx tokens (BTC).
- When input is non-Solana (BTC): show only StealthEx tokens (current behavior, unchanged).
- User-held tokens appear first (sorted by balance) followed by the rest of the Jupiter catalog.

**Non-Goals:**
- Change the token search functionality (already works via `onSearchTokens`).
- Change how input (send) tokens are loaded.
- Pagination/virtualization of the token list (the TokenSelectorModal already handles this via `useTokenSearch`).

## Decisions

### D1: Add `jupiterTokens` optional prop to `SwapScreenProps`

**Choice**: Add `jupiterTokens?: SwapToken[]` to `SwapScreenProps` in `types/swap.ts`. Both swap pages load the Jupiter catalog and pass it in.

**Rationale**: Follows the existing pattern — `useSwapScreenLogic` receives all data via props/callbacks, never calls APIs directly. Keeps the hook testable and platform-agnostic.

**Alternative rejected**: Loading inside `useSwapScreenLogic` — breaks the hook's pattern of receiving data via props.

### D2: Load Jupiter tokens at page level using existing `getTokenList` + `mapToSwapToken`

**Choice**: In both `apps/mobile/swap.tsx` and `apps/extension/SwapPage.tsx`, call `getTokenList(networkId)` in a `useEffect`, map results through `mapToSwapToken()`, and pass as `jupiterTokens` prop.

**Rationale**: Reuses two existing functions. `getTokenList` already has 5-minute caching, multi-tier fallback (backend → Jupiter CDN → Solana Labs CDN), and deduplication. No new API calls or hooks needed.

### D3: Merge user balance tokens first, then Jupiter catalog (deduplicated)

**Choice**: In the `outputTokens` memo, when `inChain === 'solana'`:
1. Start with user's Solana balance tokens (they have balance/price data).
2. Append Jupiter tokens whose address is NOT already in the user's list.
3. Append only cross-chain bridge tokens (where `t.chain !== 'solana'`).

**Rationale**: User's tokens with balances should appear first for quick selection. Jupiter tokens fill out the rest of the catalog. Bridge tokens add only cross-chain destinations (BTC). Deduplication by address (not symbol) prevents duplicates while allowing different tokens with the same symbol on different chains.

### D4: Filter bridge tokens to exclude Solana chain when input is Solana

**Choice**: Change the `uniqueBridgeTokens` filter from symbol-based deduplication to chain-based exclusion:
```typescript
// Before:
const uniqueBridgeTokens = availableOutTokens.filter(t => !solanaSymbols.has(t.symbol.toLowerCase()));
// After:
const crossChainBridgeTokens = availableOutTokens.filter(t => t.chain !== 'solana');
```

**Rationale**: When input is Solana, Jupiter handles all Solana-to-Solana swaps better (faster, more tokens). StealthEx Solana SPL tokens are redundant. Only cross-chain tokens (BTC with Ethereum disabled) should come from StealthEx.

## Risks / Trade-offs

**[Initial load size]** The Jupiter verified token list is ~1000+ tokens. All are loaded at once. → **Mitigation**: `getTokenList` is already cached (5min TTL), and the TokenSelectorModal already handles long lists via `useTokenSearch` with pagination (20 per page) and local filtering.

**[No prices for non-held tokens]** Jupiter catalog tokens the user doesn't hold will have `usdPrice: undefined` and `balance: 0`. → **Acceptable**: The user can still select them; price appears after quote is fetched.
