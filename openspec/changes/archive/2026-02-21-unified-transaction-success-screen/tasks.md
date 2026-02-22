## 1. Shared Types & i18n

- [x] 1.1 Add `'success'` to `SendStep` union type in `packages/shared/src/types/ui/send-sheet.ts`
- [x] 1.2 Create `TransactionSuccessScreenProps` interface in `packages/shared/src/types/ui/transaction-success-screen.ts` with props: `title: string`, `summary: string`, `explorerUrl: string | null`, `onContinue: () => void`. Export from `packages/shared/src/types/ui/index.ts`
- [x] 1.3 Add i18n keys to `packages/shared/src/locales/en/translation.json`: `transaction.sendComplete`, `transaction.swapComplete`, `transaction.viewOnExplorer`, `transaction.continue`
- [x] 1.4 Add corresponding Spanish i18n keys to `packages/shared/src/locales/es/translation.json`

## 2. Mobile TransactionSuccessScreen Component

- [x] 2.1 Create `apps/mobile/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx` — animated green checkmark circle (spring scale), staggered fade-in for checkmark (200ms), title+summary (400ms), explorer link (500ms), continue button (600ms). Haptic feedback on mount. Conditional "View on Explorer" link using `Linking.openURL`. Uses design tokens and i18n `t()` for all strings.
- [x] 2.2 Create `apps/mobile/src/components/TransactionSuccessScreen/index.ts` barrel export

## 3. Extension TransactionSuccessScreen Component

- [x] 3.1 Create `apps/extension/src/components/TransactionSuccessScreen/TransactionSuccessScreen.tsx` — same layout using MUI styled + CSS keyframe animations (scaleIn for circle, fadeIn with staggered delays for text/link/button). Conditional "View on Explorer" link using `window.open`. Uses design tokens and i18n `t()` for all strings.
- [x] 3.2 Create `apps/extension/src/components/TransactionSuccessScreen/index.ts` barrel export

## 4. Integrate into Send Flow (Mobile)

- [x] 4.1 Update `apps/mobile/src/components/SendSheet/SendSheet.tsx`: add `txId` state, change `handleSuccess` to set `txId` + `setStep('success')` instead of closing immediately, add `handleSuccessContinue` that calls `onSuccess(txId)` + `handleClose()`, render `TransactionSuccessScreen` when `step === 'success'` (build explorer URL with `getTransactionUrl`, format summary as `"{amount} {symbol} to {truncatedAddress}"` using `getShortAddress`)

## 5. Integrate into Send Flow (Extension)

- [x] 5.1 Update `apps/extension/src/components/SendPage/SendPage.tsx`: add `txId` state, change `handleSuccess` to set `txId` + `setStep('success')` instead of calling `onBack()` immediately, add `handleSuccessContinue` that calls `onSuccess(txId)` + `onBack()`, render `TransactionSuccessScreen` when `step === 'success'` (same summary format and explorer URL logic as mobile)

## 6. Integrate into Swap Flow (Mobile)

- [x] 6.1 Add `successTxId` state to `packages/shared/src/hooks/useSwapScreenLogic.ts` — set it when swap succeeds (`setStep('success')` already exists), expose it in the return object
- [x] 6.2 Update `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`: replace `SwapSuccessScreen` import with `TransactionSuccessScreen`, pass i18n title, formatted summary (`"{inAmount} {inSymbol} → {outAmount} {outSymbol}"`), and explorer URL built from `successTxId`

## 7. Integrate into Swap Flow (Extension)

- [x] 7.1 Update `apps/extension/src/components/SwapScreen/SwapScreen.tsx`: replace `SwapSuccessScreen` import with `TransactionSuccessScreen`, same props pattern as mobile

## 8. Cleanup

- [x] 8.1 Delete `apps/mobile/src/components/SwapScreen/SwapSuccessScreen.tsx`
- [x] 8.2 Delete `apps/extension/src/components/SwapScreen/SwapSuccessScreen.tsx`
- [x] 8.3 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/mobile --filter=@salmon/extension` to verify no type errors
