## 1. ConfirmSheet Component

- [x] 1.1 Create `apps/mobile/src/components/ConfirmSheet/ConfirmSheet.tsx` — bottom sheet with title, message, cancel/confirm buttons, danger mode, optional password input, loading state. Uses BottomSheetContainer, PrimaryButton, SecondaryButton, PasswordInput.
- [x] 1.2 Create `apps/mobile/src/components/ConfirmSheet/index.ts` barrel export

## 2. SettingsSelectorList Component

- [x] 2.1 Create `apps/mobile/src/components/SettingsSelectorList/SettingsSelectorList.tsx` — generic list with `<T>`, checkmark selection, optional leading element, loading/empty states
- [x] 2.2 Create `apps/mobile/src/components/SettingsSelectorList/index.ts` barrel export

## 3. Refactor Selectors

- [x] 3.1 Refactor `LanguageSelector` to use `SettingsSelectorList`
- [x] 3.2 Refactor `NetworkSelector` to use `SettingsSelectorList`
- [x] 3.3 Refactor `CurrencySelector` to use `SettingsSelectorList` (with `renderLeadingElement` for symbol)
- [x] 3.4 Refactor `ExplorerSelector` to use `SettingsSelectorList` (with `emptyMessage`)

## 4. Exports

- [x] 4.1 Add `ConfirmSheet` and `SettingsSelectorList` exports to `apps/mobile/src/components/index.ts`

## 5. Typecheck

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/mobile` — passed
