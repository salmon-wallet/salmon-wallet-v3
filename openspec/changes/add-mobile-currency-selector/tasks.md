## 1. Mobile Currency Selector Component

- [x] 1.1 Create `apps/mobile/src/components/CurrencySelector/` with `CurrencySelector.tsx` and `index.ts`, following the existing mobile selector pattern used by `LanguageSelector` and `ExplorerSelector`
- [x] 1.2 Implement the component with `CurrencySelectorBaseProps` / `CurrencySelectorItem` from `@salmon/shared`, `SettingsScreenLayout`, and shared design tokens so it renders currency rows, symbols, and selected state without introducing mobile-local currency types
- [x] 1.3 Export the new component from the relevant mobile component barrel files so it can be used by the settings panel registry

## 2. Settings Panel Wiring

- [x] 2.1 Update `apps/mobile/app/(app)/(tabs)/_layout.tsx` to replace the current `LanguageSelector`-based `currency` panel registry entry with the new `CurrencySelector`
- [x] 2.2 Keep the registry data flow shared-driven by building items from `SUPPORTED_CURRENCIES` and `CURRENCY_MAP`, reading the active value from `useCurrencyContext()`, and applying changes through `changeCurrency()`
- [x] 2.3 Remove now-unneeded currency-to-language mapping code and imports from the mobile settings wiring without changing the surrounding settings stack behavior

## 3. Verification

- [x] 3.1 Verify the mobile settings flow manually in code by checking that the `currency` settings screen still resolves through `SettingsSheet` and `SettingsPanelStack`
- [x] 3.2 Run typecheck for the affected surface (`pnpm turbo run typecheck --filter=@salmon/mobile`) and fix any issues introduced by the new selector wiring
