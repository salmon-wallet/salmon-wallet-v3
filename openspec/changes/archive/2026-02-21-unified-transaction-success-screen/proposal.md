## Why

After confirming a send, the user sees no feedback — the sheet/page closes silently and returns to home. The swap flow has a success screen, but it lacks an explorer link and transaction ID. Both flows need a unified success screen that confirms the operation, shows the transaction signature, and provides a link to verify on a block explorer.

## What Changes

- **Create a unified `TransactionSuccessScreen`** component (per-platform: mobile + extension) that replaces the current `SwapSuccessScreen` and also serves the send flow. It shows:
  - Animated green checkmark (reusing existing animation pattern)
  - Configurable title ("Send Complete" / "Swap Complete")
  - Transaction summary line (flexible: swap amounts or send amount + recipient)
  - "View on Explorer" link that opens the transaction in the blockchain explorer (using existing `getTransactionUrl` from `@salmon/shared`)
  - "Continue" button that navigates to home screen
  - Haptic feedback on mobile
- **Add a `'success'` step to the send flow** (`SendStep` type) so `SendSheet` (mobile) and `SendPage` (extension) can render the success screen after a successful transaction instead of closing immediately
- **Refactor `SwapSuccessScreen` out** — swap flow will use the same `TransactionSuccessScreen` component, passing swap-specific props (inAmount/outAmount/symbols)
- **Wire txId and blockchain through both flows** so the explorer URL can be generated
- **Add i18n keys** for "Send Complete", "Swap Complete", "View on Explorer", "Continue"

## Capabilities

### New Capabilities
- `transaction-success-screen`: Unified animated success screen component used after both send and swap transactions complete. Shows transaction confirmation with explorer link and navigation back to home.

### Modified Capabilities
_(none — no existing specs to modify)_

## Impact

- **packages/shared**:
  - `types/ui/send-sheet.ts` — add `'success'` to `SendStep` union
  - `types/swap.ts` — no changes needed (already has `'success'` in `SwapStepBase`)
  - `hooks/useSwapScreenLogic.ts` — pass `txId` to success screen props
  - `locales/en/translation.json` + `es/translation.json` — new i18n keys
  - New shared type `TransactionSuccessScreenProps` in `types/ui/`
- **apps/mobile**:
  - New `TransactionSuccessScreen.tsx` component (replaces `SwapSuccessScreen`)
  - `SendSheet.tsx` — add success step rendering + pass txId
  - `SwapScreen.tsx` — switch from `SwapSuccessScreen` to `TransactionSuccessScreen`
- **apps/extension**:
  - New `TransactionSuccessScreen.tsx` component (replaces `SwapSuccessScreen`)
  - `SendPage.tsx` — add success step rendering + pass txId
  - `SwapScreen.tsx` — switch from `SwapSuccessScreen` to `TransactionSuccessScreen`
- **Dependencies**: Uses existing `getTransactionUrl` from `config/explorers.ts` and `Linking.openURL` (mobile) / `window.open` (extension) for explorer links
