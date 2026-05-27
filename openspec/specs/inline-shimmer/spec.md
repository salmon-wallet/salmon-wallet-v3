# inline-shimmer Specification

## Purpose
TBD - created by archiving change inline-shimmer-balance-card. Update Purpose after archive.
## Requirements
### Requirement: ShimmerRect component renders animated gradient sweep
The `ShimmerRect` component (apps/mobile) SHALL render a rounded rectangle with a left-to-right gradient sweep animation. The gradient MUST use semi-transparent white colors (`rgba(255,255,255,0.08)` base, `rgba(255,255,255,0.18)` highlight) to work on any background. The animation MUST cycle every `durationMs.shimmer` (1500ms) using `react-native-reanimated` on the UI thread. The rectangle MUST use `borderRadius.sm` for corners.

#### Scenario: ShimmerRect renders with specified dimensions
- **WHEN** `<ShimmerRect width={180} height={37} />` is rendered
- **THEN** a View of exactly 180x37 points appears with `overflow: 'hidden'` and `borderRadius` equal to `ms(borderRadius.sm)`, containing an animated `LinearGradient` that sweeps left-to-right continuously

#### Scenario: ShimmerRect animation loops infinitely
- **WHEN** the component mounts
- **THEN** the inner gradient translates from `-shimmerOffset` to `+shimmerOffset` over `durationMs.shimmer` ms with `easeInOut` easing, repeating infinitely

### Requirement: ShimmerRect accepts width, height, and optional borderRadius props
The component SHALL accept `width` (number), `height` (number), and optional `borderRadius` (number) props. When `borderRadius` is provided, it SHALL override the default `ms(borderRadius.sm)`.

#### Scenario: Custom borderRadius
- **WHEN** `<ShimmerRect width={120} height={16} borderRadius={4} />` is rendered
- **THEN** the container View uses `borderRadius: 4` instead of the default

### Requirement: BalanceCard shows inline shimmer for balance during loading
When `loading=true`, the mobile `BalanceCard` SHALL render a `ShimmerRect` inside the balance row with width `ms(componentSizes.buttonMinWidthLg)` and height `ms(fontSize.balance)`, replacing only the balance text. The card structure (gradient, logo, scales overlay, eye button area, pagination) SHALL remain visible.

#### Scenario: Balance card loading shows shimmer in balance position
- **WHEN** `<BalanceCard loading={true} blockchain="solana" ... />` is rendered
- **THEN** the card gradient, blockchain logo, and scales overlay are visible, and a `ShimmerRect` appears where the balance number would be

#### Scenario: Balance card loading does not show eye button
- **WHEN** `loading=true`
- **THEN** the eye toggle button is NOT rendered (no visibility toggle during loading, matching web behavior)

### Requirement: BalanceCard shows inline shimmer for 24h change during loading
When `loading=true`, the mobile `BalanceCard` SHALL render a `ShimmerRect` inside the change row with width `ms(componentSizes.buttonMinWidth)` and height `ms(fontSize.sm)`. The change row MUST be visible during loading (not hidden).

#### Scenario: Change row visible with shimmer during loading
- **WHEN** `<BalanceCard loading={true} ... />` is rendered
- **THEN** a change row is visible below the balance shimmer, containing a `ShimmerRect` for the change text

### Requirement: BalanceCard no longer uses BalanceCardSkeleton for loading
The mobile `BalanceCard` SHALL NOT import or render `BalanceCardSkeleton` when `loading=true`. The inline shimmer pattern replaces the full-component-swap pattern.

#### Scenario: BalanceCardSkeleton not rendered
- **WHEN** `loading=true` on BalanceCard
- **THEN** no `BalanceCardSkeleton` component is rendered; instead inline `ShimmerRect` components appear within the existing card layout

