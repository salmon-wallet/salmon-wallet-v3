## Context

`TransactionDetailModal` is a standalone modal (~1300 lines) that implements its own `Modal` + `GestureHandlerRootView` + pan gesture + backdrop + drag-to-dismiss. This duplicates `BottomSheetContainer` which already provides all of this. When `TransactionDetailModal` opens on top of `TransactionHistorySheet` (which uses `BottomSheetContainer`), the nested `GestureHandlerRootView` instances conflict and gestures fail silently.

Separately, `BottomSheetContainer`'s backdrop uses `TouchableWithoutFeedback` wrapping an `Animated.View`. When the backdrop opacity animates to 0, the `TouchableWithoutFeedback` still intercepts touches because opacity is visual-only and doesn't affect hit testing.

## Goals / Non-Goals

**Goals:**
- Transaction detail modal appears on long press with haptic feedback
- Modal is dismissible via drag, backdrop tap, and Android back button
- Screen remains interactive after closing any bottom sheet
- Reuse `BottomSheetContainer` for consistency across all sheets

**Non-Goals:**
- Changing the transaction detail modal's visual content/layout
- Adding new transaction detail fields
- Changing the long press delay or haptic style

## Decisions

### D1: Migrate TransactionDetailModal to BottomSheetContainer

Wrap the existing content (transaction info, token logos, address rows, explorer link, etc.) inside `BottomSheetContainer` instead of a standalone `Modal`. This eliminates:
- The duplicate `GestureHandlerRootView` (root cause of gesture conflicts)
- The duplicate pan gesture setup (~50 lines)
- The duplicate backdrop + animation logic (~40 lines)
- The duplicate Android back handler (~15 lines)

The modal content (everything inside the sheet body) remains unchanged. Only the outer wrapper changes.

**Props mapping:**
- `visible` → `BottomSheetContainer.visible`
- `onClose` → `BottomSheetContainer.onClose`
- Remove: `GestureHandlerRootView`, `panGesture`, `backdropOpacity`, `translateY`, `dragY`, all animation useEffects

### D2: Fix BottomSheetContainer backdrop pointer events

Add `pointerEvents` prop to the backdrop `Animated.View` based on visibility state:

```tsx
<Reanimated.View
  style={[styles.backdrop, backdropAnimatedStyle]}
  pointerEvents={visible ? 'auto' : 'none'}
/>
```

Replace `TouchableWithoutFeedback` wrapping the backdrop with a direct `Pressable` or use `onTouchEnd` on the animated view, since `pointerEvents="none"` and `TouchableWithoutFeedback` conflict.

Simpler approach: keep `TouchableWithoutFeedback` but add `pointerEvents` to the parent overlay `View`:

The backdrop is inside `<View style={styles.overlay}>`. Since the entire Modal returns `null` when `isRendered` is false, the `pointerEvents` issue only manifests during the closing animation gap. The fix is to ensure `completeClose` fully resets all animated values.

### D3: Reset animated values in completeClose

In `BottomSheetContainer.completeClose()`, reset `backdropOpacity` to 0:

```tsx
const completeClose = useCallback(() => {
  setIsRendered(false);
  dragY.value = 0;
  backdropOpacity.value = 0;  // Add this
}, [dragY, backdropOpacity]);
```

This ensures no stale animated state remains when the component unmounts.

## Risks / Trade-offs

- **[Risk] Content layout shift** — TransactionDetailModal's content currently has custom padding/margins that assume it controls its own container. Wrapping in BottomSheetContainer may need minor padding adjustments. **Mitigation:** Test visually and adjust styles.
- **[Trade-off] Two modals stacked** — The detail modal opens while TransactionHistorySheet is still open (two BottomSheetContainers stacked). Since both use the same gesture system now (single GestureHandlerRootView from the Modal), this should work. React Native's Modal stacking handles z-ordering correctly.
