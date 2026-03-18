## 1. Remove lock screen slide-down animation (instant appear)

- [ ] 1.1 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — When `locked` becomes `true`, set `translateY.value = 0` immediately (no `withTiming`). Keep `setIsVisible(true)`, `setPassword('')`, `setError(null)` resets.
- [ ] 1.2 Remove the `withTiming` call for the `locked === true` branch in the animation useEffect. Only keep the unlock (slide up) animation.

## 2. Change unlock animation to slide up to header height

- [ ] 2.1 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Accept a new prop `headerHeight: number` (safe area top + componentSizes.headerHeight).
- [ ] 2.2 Change unlock animation target from `-screenHeight` to `-(screenHeight - headerHeight)`. This slides the lock screen up but stops at the header bar position instead of going fully off-screen. Reduce duration from 800ms to 600ms.
- [ ] 2.3 Update `LockScreenOverlay/types.ts` — Add `headerHeight: number` to `LockScreenOverlayProps`.

## 3. Hide WalletHeader while locked, fade in on unlock

- [ ] 3.1 `apps/mobile/src/components/WalletHeader/WalletHeader.tsx` — Add `animateIn?: boolean` prop. Wrap content in an `Animated.View` with opacity controlled by a `useSharedValue`. When `animateIn` changes from `false` to `true`, animate opacity from 0 to 1 over 200ms. When `animateIn` is `false`, set opacity to 0 immediately.
- [ ] 3.2 Update `WalletHeader/types.ts` — Add `animateIn?: boolean` to `WalletHeaderProps`.

## 4. Coordinate in _layout.tsx

- [ ] 4.1 `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Add state `headerVisible` (boolean, default `true`). Set to `false` when lock screen appears, set to `true` in `onAnimationComplete` callback from `LockScreenOverlay`.
- [ ] 4.2 Pass `headerHeight={insets.top + componentSizes.headerHeight}` to `LockScreenOverlay`.
- [ ] 4.3 Pass `animateIn={headerVisible}` to `WalletHeader`.
- [ ] 4.4 Ensure `headerVisible` resets to `false` when `locked` becomes `true` (so header is hidden behind lock screen).
