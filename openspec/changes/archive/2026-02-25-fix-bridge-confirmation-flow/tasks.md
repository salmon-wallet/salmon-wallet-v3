## 1. Fix backend exchange response

- [x] 1.1 In `salmon-api/src/resources/bridge-exchange-resource.js`, transform return fields from snake_case to camelCase matching `BridgeExchange` type
- [x] 1.2 In `salmon-api/src/controllers/bridge-controller.js`, apply the decorator to `createExchange`
- [x] 1.3 Restart Docker container and verify with curl that `/v1/bridge/exchange` returns camelCase fields

## 2. Remove duplicate alerts

- [x] 2.1 In `packages/shared/src/hooks/useSwapScreenLogic.ts`, remove the `onBridgeInitiated` call from `handleConfirmBridge`
- [x] 2.2 In `apps/extension/src/components/SwapScreen/SwapScreen.tsx`, remove the `onBridgeInitiated` callback
- [x] 2.3 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`, remove the `onBridgeInitiated` callback
- [x] 2.4 In `apps/extension/src/pages/swap/SwapPage.tsx`, remove `window.alert` from `handleBridgeSuccess`
- [x] 2.5 In `apps/mobile/app/(app)/(tabs)/swap.tsx`, remove `Alert.alert` from `handleBridgeSuccess`

## 3. Add bridge exchange state to hook

- [x] 3.1 In `useSwapScreenLogic.ts`, add `successExchange` state, set in `handleConfirmBridge`, clear in `handleSuccessContinue`, add to return type and return object

## 4. Extend success screen with bridge info

- [x] 4.1 In `packages/shared/src/types/ui/transaction-success-screen.ts`, add optional bridge props
- [x] 4.2 In `apps/extension/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`, render bridge info when bridge props are present
- [x] 4.3 In `apps/mobile/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`, same bridge info rendering
- [x] 4.4 In `apps/extension/src/components/SwapScreen/SwapScreen.tsx`, pass `logic.successExchange` bridge fields to `TransactionSuccessScreen`
- [x] 4.5 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`, same — pass bridge fields to success screen

## 5. Verify

- [x] 5.1 Run `pnpm turbo run typecheck` and confirm zero errors
