## Why

When confirming a bridge swap (e.g., USDC → BTC via StealthEx), three bugs occur: (1) the backend returns raw StealthEx snake_case fields but the frontend expects camelCase, causing `undefined` values in alerts, (2) two duplicate alerts fire sequentially (`onBridgeSuccess` and `onBridgeInitiated`), and (3) both use `window.alert()` / `Alert.alert()` instead of showing bridge info in the in-app success screen.

## What Changes

- **Fix backend exchange response**: Apply the decorator to `createExchange` in `bridge-controller.js` and transform the decorator output to camelCase fields matching the frontend `BridgeExchange` type.
- **Remove duplicate alert mechanism**: Remove `onBridgeInitiated` callback from both SwapScreen components and its invocation in `useSwapScreenLogic`. Remove `window.alert` / `Alert.alert` from `handleBridgeSuccess` handlers.
- **Show bridge info in success screen**: Add `successExchange` state to `useSwapScreenLogic`, extend `TransactionSuccessScreenProps` with optional bridge fields, and render deposit address + amounts in both platform success screens.

## Capabilities

### New Capabilities

- `bridge-confirmation-ux`: Fix the bridge confirmation flow to show correct data in the in-app success screen instead of native browser alerts with undefined values.

### Modified Capabilities

_(none)_

## Impact

- **`salmon-api/src/controllers/bridge-controller.js`** — Apply decorator to createExchange
- **`salmon-api/src/resources/bridge-exchange-resource.js`** — Transform to camelCase fields
- **`packages/shared/src/hooks/useSwapScreenLogic.ts`** — Add `successExchange` state, remove `onBridgeInitiated` call
- **`packages/shared/src/types/ui/transaction-success-screen.ts`** — Add optional bridge props
- **`apps/extension/src/components/SwapScreen/SwapScreen.tsx`** — Remove alert callback, pass bridge data to success screen
- **`apps/extension/src/pages/swap/SwapPage.tsx`** — Remove alert from handleBridgeSuccess
- **`apps/extension/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`** — Render bridge info
- **`apps/mobile/src/components/SwapScreen/SwapScreen.tsx`** — Remove alert callback, pass bridge data to success screen
- **`apps/mobile/app/(app)/(tabs)/swap.tsx`** — Remove alert from handleBridgeSuccess
- **`apps/mobile/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`** — Render bridge info
