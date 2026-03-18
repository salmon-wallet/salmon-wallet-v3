## Why

The 3D touch / long press preview on transaction items is broken: (1) the haptic vibration fires but the `TransactionDetailModal` doesn't appear because it wraps its own `GestureHandlerRootView` inside a `Modal`, conflicting with the `GestureHandlerRootView` in the parent `BottomSheetContainer` of `TransactionHistorySheet`; (2) after closing the transaction history sheet, the screen becomes unresponsive because the `BottomSheetContainer` backdrop lacks `pointerEvents="none"` when invisible, so a 0-opacity `TouchableWithoutFeedback` view continues capturing all touches.

## What Changes

- **Migrate `TransactionDetailModal` to use `BottomSheetContainer`** — eliminate the duplicate Modal + GestureHandlerRootView + pan gesture + backdrop implementation, reusing the existing shared container that all other bottom sheets use
- **Fix `BottomSheetContainer` backdrop pointer events** — add `pointerEvents="none"` to the backdrop when the sheet is closing/closed so touches pass through to underlying content
- **Preserve 3D touch / long press UX** — maintain the haptic feedback, long press trigger on `TransactionItem`, and the detail modal content (transaction info, copy hash, share, explorer link)

## Capabilities

### New Capabilities
- `transaction-detail-preview`: Defines the long press → detail modal flow for transaction items, including haptic feedback, modal presentation via `BottomSheetContainer`, and dismiss behavior

### Modified Capabilities
_None — `BottomSheetContainer` fix is internal implementation, no spec-level behavior change_

## Impact

- **`apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx`** — Rewrite to use `BottomSheetContainer` instead of standalone Modal + gesture system. Remove ~150 lines of duplicate animation/gesture code.
- **`apps/mobile/src/components/BottomSheetContainer/BottomSheetContainer.tsx`** — Add `pointerEvents` to backdrop animated view based on close state
- **`apps/mobile/app/(app)/(tabs)/index.tsx`** — No changes needed (already wires `detailModalVisible`, `selectedTransaction`, handlers correctly)
- No extension/web/shared impact — mobile-only UI components
