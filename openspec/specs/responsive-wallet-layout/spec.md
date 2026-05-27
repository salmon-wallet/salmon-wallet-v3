# responsive-wallet-layout Specification

## Purpose

Define the responsive layout primitives the web wallet relies on: a `WalletLayout` wrapper that centres content at 500px max-width, a `PageShell` that opts into the same max-width without breaking extension usage, and viewport-clamped sizing for `BaseSheetDialog`, `BaseDialog`, `TokenSelectorModal`, `TransactionDetailModal`, and `NftCarouselSection` so the wallet renders correctly across mobile-to-desktop browser viewports.

## Requirements

### Requirement: WalletLayout wrapper component
`packages/ui` SHALL export a `WalletLayout` component that provides a centered container with `max-width: 500px`, `width: 100%`, `min-height: 100vh`, and `margin: 0 auto`. It MUST use `colors.background.primary` as the background color.

#### Scenario: Desktop viewport
- **WHEN** the web app renders on a 1440px wide viewport
- **THEN** the wallet content is centered with 500px max-width and equal margins on both sides

#### Scenario: Mobile viewport
- **WHEN** the web app renders on a 375px wide viewport
- **THEN** the wallet content takes full width with no horizontal margins

### Requirement: PageShell supports max-width
`PageShell` SHALL accept an optional `maxWidth` prop (number, default undefined). When provided, the outermost Container MUST apply `max-width` and `margin: 0 auto`. The existing `height: 100vh` / `minHeight: 100vh` behavior MUST remain unchanged.

#### Scenario: PageShell in extension (no maxWidth)
- **WHEN** `PageShell` renders without `maxWidth` prop
- **THEN** it behaves identically to the current implementation (no regression)

#### Scenario: PageShell in web app (with maxWidth)
- **WHEN** `PageShell` renders with `maxWidth={500}`
- **THEN** the container is centered with 500px max-width

### Requirement: BaseSheetDialog responsive size presets
The `SIZE_PRESETS` in `BaseSheetDialog/types.ts` SHALL use viewport-clamped values: `maxWidth` MUST use `min(<current-value>px, 95vw)` to prevent horizontal overflow on mobile viewports.

#### Scenario: Dialog on mobile viewport
- **WHEN** a `BaseSheetDialog` with size "medium" renders on a 360px viewport
- **THEN** the dialog width is clamped to `95vw` (342px) instead of overflowing at 440px

#### Scenario: Dialog on desktop viewport
- **WHEN** a `BaseSheetDialog` with size "medium" renders on a 1440px viewport
- **THEN** the dialog width remains at 440px max (unchanged behavior)

### Requirement: BaseDialog responsive sizing
The `BaseDialog` styled component SHALL use `maxWidth: min(400px, 95vw)` instead of hardcoded `maxWidth: 400`.

#### Scenario: BaseDialog on mobile
- **WHEN** a `BaseDialog` renders on a 360px viewport
- **THEN** it does not overflow horizontally

### Requirement: TokenSelectorModal responsive sizing
The `TokenSelectorModal` SHALL use `maxWidth: min(420px, 95vw)` and `minWidth: min(360px, 90vw)`.

#### Scenario: Token selector on mobile
- **WHEN** the token selector opens on a 375px viewport
- **THEN** it fits within the viewport without horizontal scrolling

### Requirement: TransactionDetailModal responsive sizing
The `TransactionDetailModal` SHALL use `maxWidth: min(440px, 95vw)` and `minWidth: min(380px, 90vw)`.

#### Scenario: Transaction modal on mobile
- **WHEN** the transaction detail modal opens on a 375px viewport
- **THEN** it fits within the viewport without horizontal scrolling

### Requirement: NftCarouselSection responsive columns
`NftCarouselSection` SHALL calculate `VISIBLE_COUNT` based on the container width rather than using a hardcoded value. It MUST show at least 2 items and scale up on wider containers.

#### Scenario: Carousel on narrow viewport
- **WHEN** the carousel renders in a container under 400px wide
- **THEN** it shows 2 NFT cards

#### Scenario: Carousel on wide container
- **WHEN** the carousel renders in a container over 600px wide
- **THEN** it shows 3 or more NFT cards
