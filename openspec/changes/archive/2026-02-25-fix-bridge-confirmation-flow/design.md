## Context

When the user confirms a USDC → BTC bridge, `handleConfirmBridge` in `useSwapScreenLogic.ts` calls `onCreateBridgeExchange` which hits `GET /v1/bridge/exchange`. The backend controller returns raw StealthEx data (snake_case: `address_from`, `amount_to`) without applying the decorator. The frontend `BridgeExchange` type expects camelCase (`payinAddress`, `amountExpectedTo`), so all mapped fields are `undefined`. Additionally, two callbacks fire (`onBridgeSuccess` + `onBridgeInitiated`), each showing a `window.alert()`.

## Goals / Non-Goals

**Goals:**
- Fix the backend to return camelCase fields matching the frontend type.
- Remove duplicate alert mechanism — one callback, no native alerts.
- Show bridge info (deposit address, amounts, exchange ID) in the in-app success screen.

**Non-Goals:**
- Auto-send funds to the deposit address (user must do this manually for now).
- Bridge status tracking/polling after exchange creation.

## Decisions

### D1: Fix the backend decorator to return camelCase and apply it to createExchange

**Choice**: Modify `bridge-exchange-resource.js` to return camelCase fields matching `BridgeExchange` type. Apply decorator in `bridge-controller.js` `createExchange` (same as `getTransaction` already does).

**Rationale**: Fixes the data at the source. The frontend type `BridgeExchange` already defines the expected camelCase contract. `getTransaction` also uses this decorator, so fixing it fixes both endpoints consistently.

### D2: Remove `onBridgeInitiated` entirely

**Choice**: Remove the `onBridgeInitiated` call from `handleConfirmBridge` in `useSwapScreenLogic.ts`. Remove the `onBridgeInitiated` callback definition from both SwapScreen components. Remove `window.alert`/`Alert.alert` from `handleBridgeSuccess` in both SwapPage components (keep only `resetBridge()`).

**Rationale**: The bridge info should be displayed in the success screen, not in blocking native alerts. One callback (`onBridgeSuccess`) for cleanup is enough.

### D3: Add `successExchange` state to hook return

**Choice**: Add `successExchange: BridgeExchangeSimple | null` state in `useSwapScreenLogic`. Set it in `handleConfirmBridge` on success. Clear it in `handleSuccessContinue`. Return it from the hook.

**Rationale**: The success screen needs access to bridge exchange data. Currently the hook only returns `successTxId` (for Jupiter swaps). Adding `successExchange` follows the same pattern.

### D4: Extend TransactionSuccessScreenProps with optional bridge fields

**Choice**: Add optional props to `TransactionSuccessScreenProps`: `bridgeDepositAddress`, `bridgeAmountIn`, `bridgeAmountOut`, `bridgeExchangeId`. When present, the success screen renders bridge-specific content instead of the explorer link.

**Rationale**: Keeps the component backwards-compatible — existing swap success usage doesn't change. Bridge mode activates only when the new props are provided.

## Risks / Trade-offs

**[Backend change affects getTransaction too]** The decorator is shared between `createExchange` and `getTransaction`. Changing field names to camelCase affects both. → **Acceptable**: The frontend `BridgeExchange` type already expects camelCase, so this aligns both endpoints.
