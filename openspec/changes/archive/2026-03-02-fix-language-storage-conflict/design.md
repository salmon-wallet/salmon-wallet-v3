## Approach

Remove i18next's direct localStorage access and make TypedStorage the single source of truth for `salmon_language`.

## Changes

### 1. i18n configs (web + extension)

Remove `'localStorage'` from `detection.order` and `detection.caches`. Keep `navigator` and `htmlTag` for initial language detection on fresh installs.

```typescript
detection: {
  order: ['navigator', 'htmlTag'],
  // no caches — useLanguage handles persistence
}
```

Also remove `lookupLocalStorage` since it's no longer needed.

### 2. TypedStorage.getItem resilience

Wrap `JSON.parse` in a try/catch that returns the raw string if it's a valid language code, or `null` otherwise. This handles the transition for users who already have a corrupted `'en'` value in localStorage.

```typescript
async getItem<T>(key: string): Promise<T | null> {
  const raw = await adapter.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Fallback: return raw value for simple strings (e.g., corrupted language codes)
    return raw as T;
  }
}
```

### 3. useLanguage hook — verify initial sync

The hook already calls `i18n.changeLanguage(savedLanguage)` on load. Verify this works correctly when i18next no longer caches to localStorage. No changes expected here.

## Risks

- Users with existing corrupted `salmon_language` values: handled by the getItem fallback.
- Fresh installs: i18next still detects browser language via `navigator`, then useLanguage overrides if a preference was saved.
