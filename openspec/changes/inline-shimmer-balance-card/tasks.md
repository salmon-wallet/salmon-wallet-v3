## 1. ShimmerRect Component

- [x] 1.1 Create `apps/mobile/src/components/ShimmerRect/ShimmerRect.tsx` — Reanimated-based component with `width`, `height`, `borderRadius` props. Uses `withRepeat(withTiming(...))` to translate a `LinearGradient` (expo-linear-gradient) left-to-right inside an `overflow: 'hidden'` container. Gradient colors: `rgba(255,255,255,0.08)` → `rgba(255,255,255,0.18)` → `rgba(255,255,255,0.08)`. Duration: `durationMs.shimmer`. Travel: `componentSizes.shimmerOffset`. Default borderRadius: `ms(borderRadius.sm)`.
- [x] 1.2 Create `apps/mobile/src/components/ShimmerRect/index.ts` — barrel export for `ShimmerRect`
- [x] 1.3 Export `ShimmerRect` from `apps/mobile/src/components/index.ts`

## 2. BalanceCard Integration

- [x] 2.1 Modify `apps/mobile/src/components/BalanceCard/BalanceCard.tsx` — Replace the `{loading ? <BalanceCardSkeleton /> : renderBalance()}` block with `{loading ? <BalanceRow><ShimmerRect width={ms(componentSizes.buttonMinWidthLg)} height={ms(fontSize.balance)} /></BalanceRow> : renderBalance()}`. Remove `BalanceCardSkeleton` import.
- [x] 2.2 Modify the change row — Replace `{!loading && renderChange()}` with `{loading ? <ChangeRow><ShimmerRect width={ms(componentSizes.buttonMinWidth)} height={ms(fontSize.sm)} /></ChangeRow> : renderChange()}` so the change row is always visible during loading (with shimmer).
- [x] 2.3 Verify `BalanceCardSkeleton` is no longer imported or used in `BalanceCard.tsx`. Keep the file for backwards compatibility.

## 3. Validation

- [x] 3.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/mobile`
