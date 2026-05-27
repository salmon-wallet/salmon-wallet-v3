## Why

Mobile's BalanceCard replaces the entire component with a `BalanceCardSkeleton` (ContentLoader SVG) during loading, hiding the card structure (logo, gradient, eye button). Web/extension uses inline shimmer rectangles that replace only the balance number and 24h change text, keeping the full card visible. This creates a visual inconsistency between platforms and a worse UX on mobile — users should see the card structure immediately with only the data fields shimmering.

## What Changes

- Modify mobile `BalanceCard` to render inline shimmer rectangles for the balance and change rows when `loading=true`, instead of swapping to `BalanceCardSkeleton`
- Create a reusable `ShimmerRect` React Native component using `react-native-reanimated` that mimics the CSS keyframes shimmer from web (linear gradient sweep, using shared tokens `durationMs.shimmer`, `componentSizes.shimmerOffset/shimmerWidth`)
- Remove the full-component-replacement pattern (`BalanceCardSkeleton` import and usage) from `BalanceCard.tsx`
- Keep `BalanceCardSkeleton` file for backwards compatibility but it will no longer be used by `BalanceCard` itself

## Capabilities

### New Capabilities
- `inline-shimmer`: A reusable React Native `ShimmerRect` component for inline loading placeholders, matching web's CSS keyframes shimmer pattern using Reanimated

### Modified Capabilities
_None — no existing spec-level requirements change._

## Impact

- **apps/mobile**: `BalanceCard.tsx` rendering logic changes (inline shimmer instead of skeleton swap), new `ShimmerRect` component
- **packages/shared**: `durationMs.shimmer`, `componentSizes.shimmerOffset`, `componentSizes.shimmerWidth`, `borderRadius.sm` tokens already exist and will be consumed by the new component
- **No breaking changes**: Props interface unchanged, only internal rendering differs
