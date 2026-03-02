## 1. Remove i18next localStorage access

- [x] 1.1 In `apps/web/src/i18n/config.ts`, remove `'localStorage'` from `detection.order` and `detection.caches`, and remove `lookupLocalStorage`
- [x] 1.2 In `apps/extension/src/i18n/config.ts`, apply the same changes

## 2. Add resilient fallback in TypedStorage.getItem

- [x] 2.1 In `packages/shared/src/storage/storage.ts`, wrap the `JSON.parse` in `getItem` with a try/catch that returns the raw string as fallback instead of throwing

## 3. Verify useLanguage initial sync

- [x] 3.1 Verified `useLanguage` calls `i18n.changeLanguage()` on load and on change — already implemented correctly

## 4. Typecheck

- [x] 4.1 Typecheck passed for `@salmon/shared`, `@salmon/web`, `@salmon/extension` (pre-existing errors in `background.ts` unrelated to this change)
