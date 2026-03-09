## 1. SettingsSheet — `isDanger`

- [x] 1.1 In `packages/ui/src/components/SettingsSheet/SettingsSheet.tsx`, rename `isDanger` to `$isDanger` in: `SectionTitle` (line 241), `StyledListItemButton` (line 255), `StyledListItemIcon` (line 266), `StyledListItemText` (line 273) — update generic types, destructuring, and all JSX usage sites

## 2. BaseDialog — `isDanger`

- [x] 2.1 In `packages/ui/src/components/BaseDialog/styles.ts`, rename `isDanger` to `$isDanger` in `StyledActionButton` (line 153) — update generic type, destructuring, and all JSX usage

## 3. WalletSwitcherSheet — `isActive`, `bgColor`

- [x] 3.1 In `packages/ui/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx`, rename `isActive` to `$isActive` in `StyledListItem` (line 50) and `bgColor` to `$bgColor` in `AccountAvatar` (line 62)

## 4. PriceChart — `height`, `selected`

- [x] 4.1 In `packages/ui/src/components/PriceChart/PriceChart.tsx`, rename `height` to `$height` in `ChartContainer` (line 51) and `EmptyState` (line 91), rename `selected` to `$selected` in `PeriodButton` (line 66)

## 5. ActionButtonRow — `disabled`

- [x] 5.1 In `packages/ui/src/components/ActionButtonRow/ActionButtonRow.tsx`, rename `disabled` to `$disabled` in `ButtonWrapper` (line 39) and `ButtonText` (line 94) — these are on Box/Typography which don't accept `disabled`

## 6. InputAddress — `borderColor`, `isDisabled`, `inputDisabled`, `messageType`

- [x] 6.1 In `packages/ui/src/components/InputAddress/InputAddress.tsx`, rename `borderColor` to `$borderColor` and `isDisabled` to `$isDisabled` in `InputWrapper` (line 47), rename `inputDisabled` to `$inputDisabled` in `StyledInput` (line 64), rename `messageType` to `$messageType` in `MessageText` (line 109)

## 7. SendPage — `messageType`, `isDisabled`

- [x] 7.1 In `packages/ui/src/components/SendPage/StepAddressAmount.tsx`, rename `messageType` to `$messageType` in `ValidationMessage` (line 196), rename `isDisabled` to `$isDisabled` in `ReviewButtonGradient` (line 305)

## 8. PasswordInput — `borderColor`

- [x] 8.1 In `packages/ui/src/components/PasswordInput/PasswordInput.tsx`, rename `borderColor` to `$borderColor` in `InputWrapper` (line 27)

## 9. SeedWordInput — `borderColor`

- [x] 9.1 In `packages/ui/src/components/SeedPhrase/SeedWordInput.tsx`, rename `borderColor` to `$borderColor` in `StyledInput` (line 26)

## 10. SettingsSelectorList — `selected`

- [x] 10.1 In `packages/ui/src/components/SettingsSelectorList/SettingsSelectorList.tsx`, rename `selected` to `$selected` in `StyledListItemButton` (line 21)

## 11. Verification

- [x] 11.1 Run `pnpm turbo run typecheck --filter=@salmon/ui --filter=@salmon/web --filter=@salmon/extension` to confirm no type errors
