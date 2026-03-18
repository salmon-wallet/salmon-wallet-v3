## Why

Mobile already exposes a `currency` entry inside the settings sheet, but `apps/mobile/src/components` does not provide a `CurrencySelector` panel to back that option. This leaves mobile behind the existing web/extension settings capability and forces currency display to remain configurable only outside the current mobile component architecture.

## What Changes

- Add a native `CurrencySelector` component in `apps/mobile/src/components/CurrencySelector/` following the same settings-panel architecture used by `LanguageSelector` and `ExplorerSelector`
- Wire the `currency` settings entry in mobile so it opens the new selector through the existing `SettingsSheet` and `SettingsPanelStack` flow instead of remaining a dead-end option
- Reuse existing shared contracts from `@salmon/shared`, including settings types, supported currency data, and `useCurrencyContext()` actions/state, instead of introducing mobile-local currency types or storage logic
- Preserve the existing extension/web behavior and shared currency domain logic; this change adds the missing mobile UI surface only

## Capabilities

### New Capabilities

- `currency-selector`: Mobile users can open a settings panel that lists supported display currencies, shows the active selection, and persists currency changes through the shared currency context

### Modified Capabilities

_(none)_

## Impact

- **`apps/mobile/src/components/`** — New `CurrencySelector` component plus exports, styled with existing React Native settings patterns and shared tokens
- **`apps/mobile/src/components/SettingsSheet/` and panel registry wiring** — The existing `currency` option must push/render the new panel within the current stacked settings flow
- **`packages/shared/src/types/settings.ts` and `packages/shared/src/contexts/CurrencyContext.tsx`** — Reused as the canonical source of selector props, supported currencies, and currency change actions; no mobile-local duplicates should be introduced
- **Feature parity across platforms** — Web/extension already expose currency selection; mobile will match that capability within its native settings UX
