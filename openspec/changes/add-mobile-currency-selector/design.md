## Context

Mobile settings already include a `currency` entry in `apps/mobile/src/components/SettingsSheet/SettingsSheet.tsx`, and the settings panel registry in `apps/mobile/app/(app)/(tabs)/_layout.tsx` already resolves that screen. However, the current wiring is a stopgap: it maps shared `CurrencySelectorItem` data into `LanguageSelector` props and renders `LanguageSelector` for currency selection instead of a native currency-specific component.

The shared currency domain already exists in `packages/shared/src/contexts/CurrencyContext.tsx`, `packages/shared/src/types/currency.ts`, and `packages/shared/src/types/settings.ts`. That means this change does not need new state management, new storage, or new domain contracts. The missing piece is a React Native component that matches the existing mobile settings architecture:

- presentational selector component in `apps/mobile/src/components/<ComponentName>/`
- props typed from `@salmon/shared`
- panel registry wiring in `apps/mobile/app/(app)/(tabs)/_layout.tsx`
- navigation handled by `SettingsSheet` + `SettingsPanelStack`

## Goals / Non-Goals

**Goals:**
- Add `apps/mobile/src/components/CurrencySelector/` as the native currency settings panel
- Reuse `CurrencySelectorBaseProps`, `CurrencySelectorItem`, `SUPPORTED_CURRENCIES`, `CURRENCY_MAP`, and `useCurrencyContext()` from `@salmon/shared`
- Replace the `LanguageSelector` fallback in `apps/mobile/app/(app)/(tabs)/_layout.tsx` with the new component
- Keep the current panel-stack navigation model unchanged: selecting `currency` still pushes a panel inside the existing settings flow

**Non-Goals:**
- Do not redesign the broader mobile settings visuals beyond what is necessary for the new component
- Do not introduce a new generic React Native selector primitive in shared or mobile as part of this change
- Do not change web or extension currency selection behavior
- Do not move currency persistence or exchange-rate fetching out of `CurrencyContext`

## Decisions

### 1. Add a dedicated React Native `CurrencySelector` component

The new component will live at `apps/mobile/src/components/CurrencySelector/CurrencySelector.tsx` with its own `index.ts`, matching the structure used by `LanguageSelector` and `ExplorerSelector`.

Why:
- The current `LanguageSelector` reuse is semantically wrong and couples currency behavior to language-specific prop names (`languages`, `activeLanguageCode`, `onSelectLanguage`)
- Web already has a dedicated `CurrencySelector`; mobile should expose the same concept with native UI primitives
- A dedicated component makes later visual comparison and parity work cleaner

Alternative considered:
- Keep using `LanguageSelector` with transformed currency data. Rejected because it preserves a misleading contract and makes future currency-specific styling or copy harder.

### 2. Keep the component presentational and keep context wiring in `apps/mobile/app/(app)/(tabs)/_layout.tsx`

The new selector will receive shared base props and render the list. The panel registry will continue to assemble the items from shared currency metadata and call `changeCurrency()` from `useCurrencyContext()`.

Why:
- This matches the existing mobile settings pattern already used by `LanguageSelector` and `ExplorerSelector`
- It avoids coupling the UI component directly to global context, which keeps it easier to test and reuse
- No new shared hook or mobile-specific container abstraction is needed

Alternative considered:
- Make `CurrencySelector` call `useCurrencyContext()` internally. Rejected because it would diverge from the existing selector architecture and make the component less composable.

### 3. Reuse shared currency metadata instead of duplicating labels or supported codes

`SUPPORTED_CURRENCIES` and `CURRENCY_MAP` from `packages/shared/src/types/currency.ts` remain the canonical source for available currencies, names, and symbols. `CurrencySelectorBaseProps` and `CurrencySelectorItem` from `packages/shared/src/types/settings.ts` remain the component contract.

Why:
- Shared already owns supported currency definitions and persistence semantics
- Reusing shared types prevents mobile-only drift in supported currency lists or labels
- This follows the repo rule that reusable types and domain data belong in `packages/shared`

Alternative considered:
- Add mobile-local constants for the list of currencies. Rejected because it would duplicate domain data and create parity risk.

### 4. Use the same visual family as other mobile settings selectors, not the web DOM structure

The component should follow the current React Native settings selector pattern: `SettingsScreenLayout`, card rows, shared tokens, and `Ionicons` check state. It should not attempt to port the MUI/DOM structure from `packages/ui/src/components/CurrencySelector/`.

Why:
- Mobile must respect its own architecture and rendering model
- Existing mobile selectors already establish the correct interaction and spacing language for settings panels
- This change is about parity of capability, not cross-platform DOM parity

Alternative considered:
- Mirror the web selector structure more literally. Rejected because the web component is DOM/MUI-specific and would fight the established mobile settings conventions.

## Risks / Trade-offs

- **Visual drift from web remains** → The mobile selector will follow native settings patterns rather than the exact web layout. This is acceptable for now and can be reviewed later in the visual parity pass.
- **Currency data shaping stays in `_layout.tsx`** → The panel registry continues to assemble selector items. This keeps the change small, but the route layout remains the composition point for settings data.
- **No new generic selector abstraction** → Currency, language, and explorer selectors will still be separate implementations with similar row patterns. This avoids over-abstracting in this change, but leaves some duplication for a future cleanup.

## Migration Plan

1. Add `CurrencySelector` under `apps/mobile/src/components/` and export it through the local barrels.
2. Update the mobile panel registry in `apps/mobile/app/(app)/(tabs)/_layout.tsx` to render `CurrencySelector` for `currency` instead of `LanguageSelector`.
3. Keep the shared `changeCurrency()` flow untouched so persistence continues to happen through `CurrencyContext`.
4. Run typecheck for the touched mobile/shared surfaces.
5. Rollback path: restore the previous `LanguageSelector`-based panel registry entry if the new component introduces regressions.

## Open Questions

- None at design level. The current architecture already exposes the necessary shared types, metadata, and actions for this selector.
