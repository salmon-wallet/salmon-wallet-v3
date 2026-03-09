## Why

i18next-browser-languagedetector and the Salmon TypedStorage layer both read/write the same localStorage key (`salmon_language`) with incompatible formats. TypedStorage wraps values in `JSON.stringify` (storing `'"en"'`), while i18next reads/writes raw strings (`'en'`). This causes `JSON.parse('en')` → `SyntaxError` on page load, logging errors and potentially breaking language persistence.

## What Changes

- Remove `localStorage` from i18next's `detection.order` and `detection.caches` in both web and extension i18n configs, so i18next no longer reads/writes `salmon_language` directly.
- Make `useLanguage` hook the sole owner of language persistence via TypedStorage.
- Ensure `useLanguage` calls `i18n.changeLanguage()` on load to feed the stored preference into i18next without i18next touching localStorage itself.
- Add a try/catch fallback in TypedStorage.getItem to handle corrupted/raw values gracefully instead of throwing.

## Capabilities

### New Capabilities

- `language-storage-single-owner`: Ensure a single code path (useLanguage hook + TypedStorage) owns the `salmon_language` key. Remove i18next's direct localStorage access.

### Modified Capabilities

_(none)_

## Impact

- `apps/web/src/i18n/config.ts` — remove localStorage from detection config
- `apps/extension/src/i18n/config.ts` — remove localStorage from detection config
- `packages/shared/src/storage/storage.ts` — add resilient fallback for corrupted values in getItem
- `packages/shared/src/hooks/useLanguage.ts` — verify it calls `i18n.changeLanguage()` on initial load
