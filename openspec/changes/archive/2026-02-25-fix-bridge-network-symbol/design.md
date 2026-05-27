## Context

StealthEx uses network-qualified symbols for tokens that exist on multiple chains. For example:
- `usdc` = Ethereum USDC (default)
- `usdcsol` = Solana USDC
- `usdtsol` = Solana USDT
- `usdcbase` = Base USDC

The current pipeline passes bare symbols (`usdc`) at every layer:
1. `useSwapScreenLogic` → `onGetBridgeEstimate(inToken.symbol, outToken.symbol, amount)`
2. `SwapPage` → `useBridge().getEstimate(symbolIn, symbolOut, amount)`
3. `useBridge` → `getBridgeEstimatedAmount(symbolIn, symbolOut, amount)`
4. `bridge.ts` API service → `GET /v1/bridge/estimate?symbolIn=usdc&symbolOut=btc&amount=33`
5. Backend `bridge-service.js` → StealthEx API: `/api/v2/fee/estimate/usdc/btc?amount=33`

The network info already exists on tokens (`inToken.networkId` = `"sol"` from StealthEx `available` response) but is never threaded through.

## Goals / Non-Goals

**Goals:**
- Bridge exchanges with multi-chain tokens (USDC, USDT) use the correct StealthEx network-qualified symbol
- The fix is backwards-compatible: bare symbols without network still work (for `btc`, `sol`, `eth`)
- Single resolution point: backend resolves `(symbol, network)` → qualified symbol

**Non-Goals:**
- Building a comprehensive symbol mapping table — rely on the StealthEx convention (`symbol` + `network` suffix)
- Changing the `available` endpoint — it already returns correct `{ symbol, network }` pairs
- UI changes — no user-facing changes needed

## Decisions

### 1. Backend resolves qualified symbols (not frontend)

**Decision:** The backend `bridge-service.js` will resolve `(symbol, network)` → StealthEx qualified symbol. The frontend passes the network as an additional query param.

**Rationale:** The backend is the single integration point with StealthEx. If StealthEx changes their symbol convention, only the backend needs updating. The frontend stays decoupled from StealthEx specifics.

**Alternative considered:** Frontend could compose qualified symbols (e.g., `usdc` + `sol` → `usdcsol`) and send them directly. Rejected because it leaks StealthEx's naming convention into the frontend.

### 2. Convention-based resolution, not a lookup table

**Decision:** Resolve via simple rule: if `network` is provided and `symbol` doesn't already end with the network suffix, append it. E.g., `(usdc, sol)` → `usdcsol`, but `(usdcsol, sol)` → `usdcsol` (no double-suffix).

**Rationale:** StealthEx's qualified symbol pattern is consistent: `{symbol}{network}`. A static lookup table would need constant maintenance as StealthEx adds tokens. The convention handles new tokens automatically.

**Edge cases:** Tokens where symbol already contains the network suffix (from `available` response) should pass through unchanged. Native tokens (`btc`, `sol`, `eth`) don't need qualification since they're unambiguous.

### 3. Thread network through existing callback signatures

**Decision:** Add optional `networkIn`/`networkOut` string params to: backend API endpoints, frontend API service functions, `useBridge` hook methods, `SwapScreenProps` callback types, and `useSwapScreenLogic` calls.

**Rationale:** All layers already accept symbol strings. Adding an optional network param next to each symbol is the minimal change that threads the context end-to-end without restructuring.

## Risks / Trade-offs

- **[Risk] StealthEx changes naming convention** → Mitigation: Resolution logic is in one backend function, easy to update.
- **[Risk] Some tokens may not follow `{symbol}{network}` pattern** → Mitigation: The `available` endpoint returns the exact qualified symbol; the output token's `networkId` already stores it. For input tokens from user's balance (which use bare symbols), the convention-based resolution is the best we can do.
- **[Trade-off] Optional params add signature width** → Acceptable since it's backwards-compatible and avoids a breaking change.
