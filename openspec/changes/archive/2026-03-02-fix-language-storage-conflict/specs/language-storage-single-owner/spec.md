## Overview

The `salmon_language` localStorage key must be owned exclusively by the `useLanguage` hook via TypedStorage. i18next must not read from or write to localStorage directly.

## Requirements

1. i18next detection config in web and extension must NOT include `'localStorage'` in `order` or `caches` arrays.
2. i18next should detect language only from `navigator` and `htmlTag` (browser defaults), then immediately be overridden by `useLanguage` calling `i18n.changeLanguage(savedLanguage)`.
3. `useLanguage` must call `i18n.changeLanguage()` with the stored preference on initial load.
4. `TypedStorage.getItem()` must not throw on corrupted/raw string values — it should return `null` and optionally clean up the bad entry.
5. The fix must apply to both web and extension. Mobile is unaffected (no LanguageDetector).

## Acceptance Criteria

- No `StorageError: Failed to parse stored value for key "salmon_language"` in console.
- Changing language in the UI persists correctly across page reloads.
- Fresh install (no localStorage) defaults to browser language correctly.
