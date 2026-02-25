## Why

StealthEx uses network-qualified symbols for multi-chain tokens (e.g., `usdcsol` for Solana USDC, `usdc` for Ethereum USDC). The current bridge pipeline only passes the bare symbol (`usdc`) without network context, causing StealthEx to default to Ethereum. This means bridge exchanges from Solana USDC generate Ethereum deposit addresses — making it impossible for users to send SPL tokens, so the exchange never completes.

## What Changes

- **Backend**: Accept optional `networkIn`/`networkOut` query params in `/v1/bridge/estimate`, `/v1/bridge/minimal`, and `/v1/bridge/exchange` endpoints. Map `(symbol, network)` → StealthEx qualified symbol (e.g., `(usdc, sol)` → `usdcsol`).
- **Frontend API service**: Pass `networkIn`/`networkOut` params to the backend in `getBridgeEstimatedAmount`, `getBridgeMinimalAmount`, and `createBridgeExchange`.
- **Frontend hooks**: Thread `networkIn`/`networkOut` from token selection through `useBridge` and `useSwapScreenLogic` to the API calls. The network info already exists on tokens (`inToken.networkId`, `outToken.networkId`) but is never propagated.
- **Backwards compatible**: The network params are optional — bare symbols still work for tokens that don't need qualification (e.g., `btc`, `sol`, `eth`).

## Capabilities

### New Capabilities
- `bridge-network-symbol-mapping`: Backend resolves StealthEx network-qualified symbols from `(symbol, network)` pairs. Covers the mapping logic, the query param plumbing, and the frontend propagation of network context through the bridge pipeline.

### Modified Capabilities
_(none — no existing spec requirements change)_

## Impact

- **Backend** (`salmon-api`): `bridge-service.js` (symbol resolution in `estimate`, `minimal`, `create`), `bridge-controller.js` (pass network params)
- **Frontend shared** (`@salmon/shared`): `api/services/bridge.ts` (add networkIn/networkOut params), `hooks/useBridge.ts` (thread network params), `hooks/useSwapScreenLogic.ts` (pass `inToken.networkId`/`outToken.networkId`), `types/swap.ts` (update callback signatures)
- **Frontend apps**: `SwapPage.tsx` (extension + mobile) — update `onGetBridgeEstimate` and `onCreateBridgeExchange` handler signatures
- **No breaking changes**: network params are optional, existing bare-symbol calls continue to work
