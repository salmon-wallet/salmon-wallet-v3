## Why

The web app's seed phrase verification screen has an off-by-one error that prevents the CONTINUE button from ever enabling, even when the user enters all three words correctly (green borders show, but the button stays disabled). This blocks wallet creation on the web platform entirely.

## What Changes

- Fix off-by-one indexing in `apps/web/src/pages/auth/CreatePage.tsx`: the `generateValidationPositions()` utility returns 1-indexed positions, but the web code treats them as 0-indexed in two places:
  - `position={pos + 1}` displays the wrong word number (e.g., shows "Word #5" for position 4)
  - `words[pos]` compares against the wrong word in the inline validation
- These two errors cancel out visually (green borders appear correct), but the button validation via `validateMnemonicWords()` correctly uses 1-indexed positions, creating a mismatch that keeps `isValid: false`
- Mobile and extension implementations are already correct (both use `words[pos - 1]` and `position={vw.position}`)

## Capabilities

### New Capabilities

- `seed-phrase-verification`: Covers the seed phrase verification step during wallet creation — position generation, word validation, and UI feedback across all platforms

### Modified Capabilities

## Impact

- **Affected code**: `apps/web/src/pages/auth/CreatePage.tsx` (lines 177, 182)
- **Affected platforms**: Web app only (mobile and extension are correct)
- **User impact**: Unblocks wallet creation flow on web — currently completely broken
- **Risk**: Minimal — two-line fix with well-understood root cause
