## Context

The wallet has a canonical blockchain feature flag at `packages/shared/src/config/blockchains.ts` (`ENABLED_BLOCKCHAINS`). It currently lists `['solana', 'bitcoin']` with Ethereum commented out. This flag already gates account creation, network scanning, and network visibility.

However, the swap module has its own hardcoded constant `SUPPORTED_CHAINS = ['solana', 'bitcoin', 'ethereum']` in `packages/shared/src/utils/swap.ts`. This is used in `useSwapScreenLogic.ts` to filter bridge tokens — meaning Ethereum tokens still appear as receive destinations even though Ethereum is disabled globally.

Additionally, `getChainFromNetwork()` maps StealthEx responses to wallet chain types. StealthEx returns lowercase network identifiers (`"sol"`, `"eth"`, `"btc"`) but the function only handles specific symbols and longer network strings containing substrings like `"solana"`, `"bitcoin"`, `"ethereum"`. Direct matches for `"sol"`, `"eth"`, `"btc"` as _network_ values are missing, which will break when the backend starts forwarding the 72+ Solana SPL tokens that StealthEx supports (they carry `network: "sol"`).

**Current code references** (exhaustive):
- `SUPPORTED_CHAINS` defined: `utils/swap.ts:51`
- `SUPPORTED_CHAINS` re-exported: `utils/index.ts:219`
- `SUPPORTED_CHAINS` imported and used: `hooks/useSwapScreenLogic.ts:23,227`

No app-level code (`apps/mobile`, `apps/extension`) imports `SUPPORTED_CHAINS` directly.

## Goals / Non-Goals

**Goals:**
- Swap receive-token filtering uses `ENABLED_BLOCKCHAINS` as single source of truth.
- `getChainFromNetwork` correctly maps StealthEx network strings (`"sol"`, `"eth"`, `"btc"`) so SPL tokens will work without further frontend changes when the backend is fixed.
- Remove `SUPPORTED_CHAINS` entirely — no dead code.

**Non-Goals:**
- Fix the backend `bridge-service.js` case-sensitivity bug (separate repo/task).
- Load the full Jupiter token catalogue into the receive list (separate feature).
- Change StealthEx API integration or add new bridge endpoints.

## Decisions

### D1: Replace `SUPPORTED_CHAINS` with `isBlockchainEnabled()` — not `ENABLED_BLOCKCHAINS` directly

**Choice**: Use the helper function `isBlockchainEnabled(chain)` instead of importing the `ENABLED_BLOCKCHAINS` array and calling `.includes()`.

**Rationale**: `isBlockchainEnabled` is the idiomatic access pattern used everywhere else in the codebase (`useAvailableNetworks.ts`, `derived-accounts.ts`, `account.ts`). It keeps the config encapsulated and is the same pattern the feature-flag commit (`5649a15`) established.

**Alternative rejected**: Importing `ENABLED_BLOCKCHAINS` directly and using `.includes()` — works but breaks the established access pattern and couples consumers to the array type.

### D2: Extend `getChainFromNetwork` with direct network-string matches

**Choice**: Add a lookup at the top of `getChainFromNetwork` that maps short network codes to chain types before falling through to the existing symbol-based and substring-based logic:

```
"sol" | "solana" → 'solana'
"btc" | "bitcoin" → 'bitcoin'
"eth" | "ethereum" | "base" → 'ethereum'
```

**Rationale**: StealthEx uses `"sol"` as the network for SPL tokens, `"eth"` for ERC-20 tokens, etc. The current code only handles longer strings via `.includes()` (e.g., `n.includes('sol')` does match `"sol"` already for the `n.includes('sol')` check) — but it does NOT match `"btc"` since the check is `n.includes('btc')` and `"btc".includes('btc')` is true. Let me re-verify...

Actually, upon closer review: `n.includes('sol')` does match `"sol"`, `n.includes('btc')` matches `"btc"`, and `n.includes('eth')` matches `"eth"`. So the existing substring checks already handle the short strings. The real gap is that the function is reached with `network: "sol"` but the **symbol-based checks run first** and may short-circuit incorrectly for SPL tokens. For example, a token `usdcsol` with `network: "sol"`:
- Symbol `"usdcsol"` doesn't match `btc`, `eth`, `sol`, and doesn't start with `eth` → falls through symbol checks.
- `network = "sol"` → `n.includes('sol')` → returns `'solana'` ✓

So actually the existing `getChainFromNetwork` **does** handle `network: "sol"` correctly for SPL tokens. The issue is only with:
- Symbol `"ethbase"`: `s.startsWith('eth')` → returns `'ethereum'` ✓ (correct)

After re-analysis, the existing network substring checks already handle the StealthEx short codes. No changes needed to `getChainFromNetwork` for correctness. The only issue is that `s.startsWith('eth')` would incorrectly classify any symbol starting with "eth" as Ethereum even if it's on a different network — but this is an edge case and the network check would not be reached if symbol matches first.

**Revised decision**: Keep `getChainFromNetwork` as-is. The existing logic already handles StealthEx's lowercase network strings correctly. The only change needed is replacing `SUPPORTED_CHAINS` with `isBlockchainEnabled`.

### D3: Filter with `isBlockchainEnabled` in the bridge token loader

**Choice**: In `useSwapScreenLogic.ts` line 227, replace:
```typescript
if (!chain || !SUPPORTED_CHAINS.includes(chain)) continue;
```
with:
```typescript
if (!chain || !isBlockchainEnabled(chain as BlockchainType)) continue;
```

**Rationale**: This is the single point where bridge tokens are filtered. Using `isBlockchainEnabled` makes it respect the global feature flag. The `as BlockchainType` cast is needed because `getChainFromNetwork` returns `SwapChainType | null` which is `string | null`, while `isBlockchainEnabled` expects `BlockchainType`.

### D4: No changes to `outputTokens` memo (lines 544-557)

**Choice**: Don't add an additional `isBlockchainEnabled` filter in the `outputTokens` computed value.

**Rationale**: The `outputTokens` memo computes the final token list from two sources: (1) `tokens` — user's balance tokens from `useMultiChainTokens`, which already respects `ENABLED_BLOCKCHAINS` via account creation gating, and (2) `availableOutTokens` — bridge tokens already filtered in D3. Adding a redundant filter would be defensive but unnecessary.

## Risks / Trade-offs

**[Type compatibility]** `getChainFromNetwork` returns `SwapChainType` (a string alias), while `isBlockchainEnabled` expects `BlockchainType`. These are the same underlying values (`'solana' | 'bitcoin' | 'ethereum'`) but TypeScript may require a cast. → **Mitigation**: Use `as BlockchainType` at the call site. This is safe because `getChainFromNetwork` only returns values from the same set.

**[Backend dependency]** Fixing the frontend filter is necessary but not sufficient — the backend still has a case-mismatch bug that prevents 72 SPL tokens from being returned. → **Mitigation**: This change prepares the frontend so that when the backend is fixed, SPL tokens flow through correctly without further frontend work.

**[Re-enabling Ethereum]** When Ethereum is eventually re-enabled in `ENABLED_BLOCKCHAINS`, ETH bridge tokens will automatically appear in swap destinations. → This is the desired behavior — the feature flag becomes the single control point.
