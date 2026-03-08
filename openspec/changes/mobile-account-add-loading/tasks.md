## 1. i18n — Add missing translation key

- [x] 1.1 Add `settings.account_add.creation_error` key to `packages/shared/src/locales/en/translation.json` (e.g., "Failed to create account. Please try again.")
- [x] 1.2 Add `settings.account_add.creation_error` key to `packages/shared/src/locales/es/translation.json` (e.g., "Error al crear la cuenta. Por favor, inténtalo de nuevo.")

## 2. Mobile AccountAddPanel — Add loading state and LoadingScreen overlay

- [x] 2.1 Add `const [loading, setLoading] = useState(false)` state to `AccountAddPanel` in `apps/mobile/src/components/AccountAddPanel/AccountAddPanel.tsx`
- [x] 2.2 Import `LoadingScreen` from `../LoadingScreen` and `Alert` from `react-native`
- [x] 2.3 Add `if (loading) return;` guard at top of `handleConfirm`
- [x] 2.4 Add `setLoading(true)` at start of `handleConfirm` try block (before `createAccount`)
- [x] 2.5 In the catch block: call `setLoading(false)` then `Alert.alert(t('general.error'), t('settings.account_add.creation_error'))`
- [x] 2.6 Render `<LoadingScreen visible={loading} title={...} subtitle={t('general.loading')} />` as sibling before `<SettingsScreenLayout>`, using the same conditional title logic as web (`selectedDerived ? t('settings.account_add.confirm_create') : t('settings.account_add.confirm_import')`)
- [x] 2.7 Add `loading` to the `useCallback` dependency array of `handleConfirm`

## 3. Verification

- [x] 3.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/mobile`
