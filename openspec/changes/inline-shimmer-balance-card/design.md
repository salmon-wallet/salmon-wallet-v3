## Context

Web's `BalanceCard` (packages/ui) uses CSS keyframes to animate a linear gradient sweep across inline `SkeletonRect` boxes. These boxes replace only the balance text and change text — the card gradient, logo, scales overlay, and pagination remain visible during loading. Mobile currently swaps the entire balance+change section for a `BalanceCardSkeleton` SVG component (ContentLoader), hiding all card structure.

Relevant shared tokens already exist:
- `durationMs.shimmer` = 1500ms (animation cycle)
- `componentSizes.shimmerOffset` = 200 (gradient travel distance)
- `componentSizes.shimmerWidth` = 400 (gradient size)
- `componentSizes.buttonMinWidthLg` / `buttonMinWidth` (skeleton widths used by web)
- `borderRadius.sm` (skeleton corner radius)
- `colors.skeleton.base` / `colors.skeleton.highlight` (skeleton colors — but web uses semi-transparent white rgba instead)

The app already depends on `react-native-reanimated` (used extensively for sheets, transitions, loading screen).

## Goals / Non-Goals

**Goals:**
- Mobile BalanceCard shows inline shimmer on balance and change text during loading, matching web's UX pattern
- Create a reusable `ShimmerRect` component in mobile that other components can adopt later
- Use the same shared design tokens as web for timing and dimensions
- Zero layout shift — shimmer rectangles MUST match the text dimensions they replace

**Non-Goals:**
- Replacing all mobile ContentLoader skeletons with ShimmerRect (future work)
- Modifying web/extension BalanceCard behavior
- Removing `BalanceCardSkeleton.tsx` file (keep for potential external consumers)

## Decisions

### 1. Animation approach: Reanimated `withRepeat` + `withTiming` over `LinearGradient`

**Choice**: Use `react-native-reanimated` to animate a `translateX` on a `LinearGradient` (expo-linear-gradient) overlay inside a masked View.

**Rationale**:
- Reanimated runs on the UI thread (no JS bridge overhead), matching the smoothness of CSS keyframes
- The app already depends on reanimated — no new dependency
- `expo-linear-gradient` is already imported by BalanceCard itself
- Avoids adding `react-native-masked-view` — instead use `overflow: 'hidden'` on the container with `borderRadius` to clip the gradient sweep

**Alternatives considered**:
- **ContentLoader inline** (current SVG approach): Would work but SVG shimmer inside a gradient card looks different from the CSS gradient sweep. Also, ContentLoader renders a full SVG viewBox which is heavier for just a rectangle.
- **Animated.View opacity pulse**: Simpler but doesn't match the left-to-right sweep effect that web has. Would be a visual downgrade.

### 2. Shimmer colors: Semi-transparent white (matching web)

**Choice**: Use `rgba(255,255,255,0.08)` → `rgba(255,255,255,0.18)` → `rgba(255,255,255,0.08)` gradient, matching web's `SkeletonRect`.

**Rationale**: The BalanceCard has a colored gradient background (per blockchain). Web uses semi-transparent white for the shimmer so it works on any gradient. Using `colors.skeleton.base/highlight` (opaque grays) would look wrong against the card gradient.

### 3. Component location: `apps/mobile/src/components/ShimmerRect/`

**Choice**: Create `ShimmerRect` as a standalone component in the mobile components directory.

**Rationale**: It's React Native platform-specific UI (uses reanimated + expo-linear-gradient), so it belongs in `apps/mobile/src/components/`, not in `packages/shared`. It can be reused by other mobile components (DerivedAccountCard, TokenList) in the future.

### 4. BalanceCard integration: Conditional inline rendering

**Choice**: Replace the `{loading ? <BalanceCardSkeleton /> : renderBalance()}` pattern with `{loading ? <ShimmerRect width={...} height={...} /> : renderBalance()}` for both balance and change rows. The change row MUST render (with shimmer) during loading instead of being hidden.

**Rationale**: Matches web exactly — web renders `<BalanceRow>` and `<ChangeRow>` wrappers with `<SkeletonRect>` inside them during loading, keeping the card structure intact.

## Risks / Trade-offs

- **[Risk] Shimmer animation performance on low-end Android** → Mitigation: Reanimated runs on UI thread; the gradient is a simple View with translateX. ContentLoader (SVG) is actually heavier.
- **[Risk] Slight visual difference from web's CSS gradient** → Mitigation: Use identical rgba values and timing token (`durationMs.shimmer`). The sweep direction and colors will match closely enough.
- **[Trade-off] BalanceCardSkeleton becomes unused** → We keep the file but remove the import from BalanceCard.tsx. If nothing else imports it, it can be cleaned up in a follow-up.
