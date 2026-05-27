## 1. Add onSendDeposit callback to SwapScreenProps

- [x] 1.1 In `packages/shared/src/types/swap.ts`, add `onSendDeposit?: (depositAddress: string, tokenAddress: string, amount: number) => Promise<{ txId: string }>` to `SwapScreenProps`

## 2. Execute deposit transfer in useSwapScreenLogic

- [x] 2.1 In `packages/shared/src/hooks/useSwapScreenLogic.ts`, destructure `onSendDeposit` from props
- [x] 2.2 In `handleConfirmBridge`, after `onCreateBridgeExchange` succeeds and returns `exchange`, call `onSendDeposit(exchange.depositAddress, inToken.address, parseFloat(inAmount))` to send the funds
- [x] 2.3 Store the deposit txId: add `depositTxId` to the success state (`useState<string | null>(null)`), set it from the `onSendDeposit` result, clear it in `handleSuccessContinue`
- [x] 2.4 Add `depositTxId` to `UseSwapScreenLogicReturn` type and return it

## 3. Wire onSendDeposit in both SwapPages

- [x] 3.1 In `apps/extension/src/pages/swap/SwapPage.tsx`, add `handleSendDeposit` callback that calls `activeBlockchainAccount.transfer(depositAddress, tokenAddress, amount)` and pass it as `onSendDeposit` to SwapScreen
- [x] 3.2 In `apps/mobile/app/(app)/(tabs)/swap.tsx`, same change

## 4. Show deposit txId in success screen

- [x] 4.1 In `packages/shared/src/types/ui/transaction-success-screen.ts`, add optional `bridgeDepositTxId?: string` prop
- [x] 4.2 In `apps/extension/src/components/SwapScreen/SwapScreen.tsx`, pass `logic.depositTxId` as `bridgeDepositTxId` to `TransactionSuccessScreen`
- [x] 4.3 In `apps/extension/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`, render deposit txId as a Solscan explorer link when `bridgeDepositTxId` is provided
- [x] 4.4 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`, pass `logic.depositTxId` as `bridgeDepositTxId` to `TransactionSuccessScreen`
- [x] 4.5 In `apps/mobile/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx`, render deposit txId as a Solscan explorer link when `bridgeDepositTxId` is provided

## 5. Verify

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/mobile --filter=@salmon/extension` and confirm zero errors
