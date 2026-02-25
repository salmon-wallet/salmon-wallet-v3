## ADDED Requirements

### Requirement: Backend resolves StealthEx qualified symbols from network param

The backend `bridge-service.js` SHALL accept optional `networkIn`/`networkOut` parameters alongside `symbolIn`/`symbolOut` in the `estimate`, `minimal`, and `create` functions. When a network param is provided, the backend SHALL resolve the qualified StealthEx symbol by appending the network suffix to the bare symbol (e.g., `usdc` + `sol` → `usdcsol`), unless the symbol already ends with the network suffix.

#### Scenario: USDC on Solana resolves to usdcsol
- **WHEN** `estimate` is called with `symbolIn=usdc` and `networkIn=sol`
- **THEN** the StealthEx API call SHALL use `usdcsol` as the currency_from

#### Scenario: BTC without network passes through unchanged
- **WHEN** `estimate` is called with `symbolIn=btc` and no `networkIn`
- **THEN** the StealthEx API call SHALL use `btc` as the currency_from

#### Scenario: Already-qualified symbol is not double-suffixed
- **WHEN** `estimate` is called with `symbolIn=usdcsol` and `networkIn=sol`
- **THEN** the StealthEx API call SHALL use `usdcsol` (not `usdcsolsol`)

### Requirement: Backend controller passes network params to service

The backend `bridge-controller.js` SHALL forward `networkIn` and `networkOut` query params from the request to the bridge service `estimate`, `minimal`, and `create` functions.

#### Scenario: Network params forwarded to estimate
- **WHEN** a request is made to `GET /v1/bridge/estimate?symbolIn=usdc&symbolOut=btc&amount=33&networkIn=sol`
- **THEN** the controller SHALL pass `{ symbolIn: 'usdc', symbolOut: 'btc', amount: 33, networkIn: 'sol' }` to `bridge-service.estimate()`

### Requirement: Frontend API service passes network params

The frontend `packages/shared/src/api/services/bridge.ts` functions `getBridgeEstimatedAmount`, `getBridgeMinimalAmount`, and `createBridgeExchange` SHALL accept optional `networkIn`/`networkOut` string parameters and include them in the API request query params.

#### Scenario: Network params included in estimate request
- **WHEN** `getBridgeEstimatedAmount('usdc', 'btc', 33, 'sol')` is called
- **THEN** the API request SHALL include `networkIn=sol` in the query params

#### Scenario: Network params omitted when not provided
- **WHEN** `getBridgeEstimatedAmount('btc', 'sol', 1)` is called without network params
- **THEN** the API request SHALL NOT include `networkIn` or `networkOut` in the query params

### Requirement: useBridge hook threads network params

The `useBridge` hook methods `getEstimate` and `createExchange` SHALL accept optional `networkIn`/`networkOut` string parameters and pass them to the underlying API service functions.

#### Scenario: getEstimate passes network to API
- **WHEN** `getEstimate('usdc', 'btc', 33, 'sol')` is called
- **THEN** it SHALL call `getBridgeEstimatedAmount('usdc', 'btc', 33, 'sol')` and `getBridgeMinimalAmount('usdc', 'btc', 'sol')`

### Requirement: SwapScreenProps callbacks include network params

The `SwapScreenProps` callback types `onGetBridgeEstimate` and `onCreateBridgeExchange` SHALL accept optional `networkIn`/`networkOut` string parameters.

#### Scenario: onGetBridgeEstimate accepts network
- **WHEN** the hook calls `onGetBridgeEstimate(symbolIn, symbolOut, amount, networkIn, networkOut)`
- **THEN** the callback signature SHALL accept all five parameters

### Requirement: useSwapScreenLogic passes token networkId as network params

The `useSwapScreenLogic` hook SHALL pass `inToken.networkId` as `networkIn` and `outToken.networkId` as `networkOut` when calling bridge estimate and create exchange callbacks.

#### Scenario: Bridge estimate uses token networkId
- **WHEN** user enters an amount with inToken `{ symbol: 'usdc', networkId: 'sol' }` and outToken `{ symbol: 'btc' }`
- **THEN** the hook SHALL call `onGetBridgeEstimate('usdc', 'btc', amount, 'sol', undefined)`

#### Scenario: Bridge exchange creation uses token networkId
- **WHEN** user confirms a bridge with inToken `{ symbol: 'usdc', networkId: 'sol' }` and outToken `{ symbol: 'btc' }`
- **THEN** the hook SHALL call `onCreateBridgeExchange('usdc', 'btc', amount, address, 'sol', undefined)`

### Requirement: SwapPage handlers thread network params to useBridge

Both `apps/extension/src/pages/swap/SwapPage.tsx` and `apps/mobile/app/(app)/(tabs)/swap.tsx` SHALL update their `handleGetBridgeEstimate` and `handleCreateBridgeExchange` handlers to accept and forward `networkIn`/`networkOut` to the `useBridge` hook methods.

#### Scenario: Extension SwapPage forwards network params
- **WHEN** `handleGetBridgeEstimate` is called with `(symbolIn, symbolOut, amount, networkIn, networkOut)`
- **THEN** it SHALL call `getBridgeEstimate(symbolIn, symbolOut, amount, networkIn, networkOut)`

#### Scenario: Mobile swap page forwards network params
- **WHEN** `handleCreateBridgeExchange` is called with `(symbolIn, symbolOut, amount, addressTo, networkIn, networkOut)`
- **THEN** it SHALL call `createBridgeExchange(symbolIn, symbolOut, amount, addressTo, networkIn, networkOut)`
