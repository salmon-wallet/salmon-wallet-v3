## 1. Fix BottomSheetContainer backdrop touch blocking

- [x] 1.1 `apps/mobile/src/components/BottomSheetContainer/BottomSheetContainer.tsx` — In `completeClose()`, reset `backdropOpacity.value = 0` alongside existing `dragY.value = 0`
- [x] 1.2 `apps/mobile/src/components/BottomSheetContainer/BottomSheetContainer.tsx` — Add `pointerEvents={visible ? 'auto' : 'none'}` to the backdrop `Reanimated.View` to prevent invisible backdrop from capturing touches during close animation

## 2. Migrate TransactionDetailModal to BottomSheetContainer

- [x] 2.1 `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Remove standalone `Modal`, `GestureHandlerRootView`, pan gesture setup, backdrop animation, `translateY`/`dragY`/`backdropOpacity` shared values, and all animation `useEffect`s
- [x] 2.2 `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Wrap content with `BottomSheetContainer` using `visible` and `onClose` props
- [x] 2.3 `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Move the sheet body content (transaction info, token logos, address rows, explorer link, share, dev fields) into `BottomSheetContainer`'s children, adjusting padding/styles as needed
- [x] 2.4 `apps/mobile/src/components/TransactionDetailModal/TransactionDetailModal.tsx` — Remove the Android `BackHandler` useEffect (BottomSheetContainer handles it)
- [ ] 2.5 Verify long press → haptic → detail modal works when opened from TransactionHistorySheet (no gesture conflicts)
- [ ] 2.6 Verify drag-to-dismiss, backdrop tap, and Android back button all close the detail modal
