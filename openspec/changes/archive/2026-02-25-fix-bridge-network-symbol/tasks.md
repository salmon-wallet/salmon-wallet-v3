## 1. Backend: symbol resolution

- [x] 1.1 In `salmon-api/src/services/bridge-service.js`, add a `resolveSymbol(symbol, network)` helper that appends the network suffix if provided and not already present (e.g., `(usdc, sol)` → `usdcsol`, `(btc, undefined)` → `btc`, `(usdcsol, sol)` → `usdcsol`)
- [x] 1.2 In `bridge-service.js`, update `estimate({ symbolIn, symbolOut, networkIn, networkOut })` to resolve both symbols before calling StealthEx
- [x] 1.3 In `bridge-service.js`, update `minimal({ symbolIn, symbolOut, networkIn, networkOut })` to resolve both symbols before calling StealthEx
- [x] 1.4 In `bridge-service.js`, update `create({ symbolIn, symbolOut, amount, addressTo, networkIn, networkOut })` to resolve both symbols before calling StealthEx
- [x] 1.5 In `salmon-api/src/controllers/bridge-controller.js`, forward `networkIn`/`networkOut` from `req.query` to `estimate`, `minimal`, and `create` service calls

## 2. Frontend API service

- [x] 2.1 In `packages/shared/src/api/services/bridge.ts`, add optional `networkIn?: string` and `networkOut?: string` params to `getBridgeEstimatedAmount` and include them in query params when provided
- [x] 2.2 Same for `getBridgeMinimalAmount`
- [x] 2.3 Same for `createBridgeExchange`

## 3. Frontend useBridge hook

- [x] 3.1 In `packages/shared/src/hooks/useBridge.ts`, update `getEstimate(symbolIn, symbolOut, amount, networkIn?, networkOut?)` to pass network params to `getBridgeEstimatedAmount` and `getBridgeMinimalAmount`
- [x] 3.2 In `useBridge.ts`, update `createExchangeCallback` to accept and forward `networkIn?`/`networkOut?` to `createBridgeExchange`

## 4. Frontend SwapScreenProps and useSwapScreenLogic

- [x] 4.1 In `packages/shared/src/types/swap.ts`, update `onGetBridgeEstimate` callback type in `SwapScreenProps` to accept optional `networkIn`/`networkOut` string params
- [x] 4.2 In `packages/shared/src/types/swap.ts`, update `onCreateBridgeExchange` callback type in `SwapScreenProps` to accept optional `networkIn`/`networkOut` string params
- [x] 4.3 In `packages/shared/src/hooks/useSwapScreenLogic.ts`, pass `inToken.networkId` and `outToken.networkId` in the bridge estimate effect (line ~296)
- [x] 4.4 In `useSwapScreenLogic.ts`, pass `inToken.networkId` and `outToken.networkId` in `handleConfirmBridge` (line ~456)
- [x] 4.5 In `useSwapScreenLogic.ts`, pass network params in `handleRefreshQuote` bridge estimate call (line ~505)

## 5. Frontend SwapPage handlers (both platforms)

- [x] 5.1 In `apps/extension/src/pages/swap/SwapPage.tsx`, update `handleGetBridgeEstimate` to accept and forward `networkIn`/`networkOut` to `getBridgeEstimate`
- [x] 5.2 In `SwapPage.tsx` (extension), update `handleCreateBridgeExchange` to accept and forward `networkIn`/`networkOut` to `createBridgeExchange`
- [x] 5.3 In `apps/mobile/app/(app)/(tabs)/swap.tsx`, update `handleGetBridgeEstimate` to accept and forward `networkIn`/`networkOut` to `getBridgeEstimate`
- [x] 5.4 In `swap.tsx` (mobile), update `handleCreateBridgeExchange` to accept and forward `networkIn`/`networkOut` to `createBridgeExchange`

## 6. Verify

- [x] 6.1 Restart backend Docker container and verify with curl that `GET /v1/bridge/estimate?symbolIn=usdc&symbolOut=btc&amount=33&networkIn=sol` returns a valid estimate
- [x] 6.2 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/mobile --filter=@salmon/extension` and confirm zero errors
