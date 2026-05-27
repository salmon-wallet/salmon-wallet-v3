# web-scaling-cap Specification

## Purpose

Cap the reference dimensions used by web scaling helpers (`s`, `vs`, `ms`, `mvs` in `scaling.ts`) so a 1440px browser window produces wallet-sized scale factors instead of ~3.27x, preserve the lazy-init dimensions cache, leave extension popup behavior unchanged, and default `WalletLayout`'s max-width to a column comparable to the extension popup viewport.

## Requirements

### Requirement: Web scaling functions must use capped dimensions
The web implementation of `s()`, `vs()`, `ms()`, `mvs()` in `scaling.ts` MUST use a fixed reference width and height that matches the wallet container size, not the full browser viewport.

#### Scenario: Web app renders in a wide browser window
- **WHEN** the web app is opened in a browser with `window.innerWidth` of 1440px
- **THEN** the scaling functions use a capped width (375px) instead of 1440px, producing a scale factor of ~0.85x instead of ~3.27x

#### Scenario: Extension popup renders at ~360px
- **WHEN** the extension popup opens at ~360px width
- **THEN** the scaling functions use 360px (below the cap), producing a scale factor of ~0.82x (unchanged behavior)

#### Scenario: Scaling is cached on first call
- **WHEN** `getDimensions()` is called for the first time
- **THEN** the capped dimensions are cached for subsequent calls (existing lazy-init behavior preserved)

### Requirement: WalletLayout default maxWidth matches mobile viewport
The `WalletLayout` component MUST default to a `maxWidth` that produces a column width similar to the extension popup viewport.

#### Scenario: Web app renders with default WalletLayout
- **WHEN** the web app renders `WalletLayout` without a custom `maxWidth` prop
- **THEN** the content column is constrained to 375px wide, centered horizontally

#### Scenario: Extension does not use WalletLayout
- **WHEN** the extension renders its popup
- **THEN** it does not use `WalletLayout` and continues to fill the popup viewport as before (no change)
