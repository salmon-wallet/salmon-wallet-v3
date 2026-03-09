## Context

The wallet creation flow has a "Verify Seed Phrase" step where the user must enter 3 randomly selected words from their mnemonic. The shared utility `generateValidationPositions()` in `packages/shared/src/crypto/mnemonic.ts` returns **1-indexed** positions (e.g., `[4, 8, 10]` meaning the 4th, 8th, and 10th words).

Mobile and extension handle this correctly:
- Display: `position={pos}` → shows "Word #4"
- Array access: `words[pos - 1]` → gets the 4th word (0-indexed)
- Button validation: `validateMnemonicWords(mnemonic, positions, inputs)` → uses `words[pos - 1]` internally

The web app (`apps/web/src/pages/auth/CreatePage.tsx`) has an off-by-one error:
- Display: `position={pos + 1}` → shows "Word #5" (wrong)
- Inline validation: `words[pos]` → checks the 5th word (wrong)
- Button validation: `validateMnemonicWords()` → checks the 4th word (correct)

The display and inline validation are consistent with each other (both shifted by +1), so the user sees green borders. But the button validation is correct per the positions, creating a mismatch that keeps the button permanently disabled.

## Goals / Non-Goals

**Goals:**
- Fix the off-by-one error in the web app so the CONTINUE button enables when all words are correct
- Align the web implementation with the pattern already used by mobile and extension

**Non-Goals:**
- Refactoring the validation logic into a shared hook (the three platforms have different state patterns; this can be a future improvement)
- Changing `generateValidationPositions()` or `validateMnemonicWords()` — these shared utilities are correct
- Modifying mobile or extension code — they already work correctly

## Decisions

### 1. Fix at the web app level only

The shared utilities (`generateValidationPositions`, `validateMnemonicWords`) are correct and consistent. The bug is purely in how `apps/web/src/pages/auth/CreatePage.tsx` consumes the 1-indexed positions. Fixing two lines in that file resolves the issue completely.

**Alternative considered:** Creating a shared hook (`useSeedValidation`) that all three platforms consume. Rejected because it adds unnecessary scope to a simple bugfix — the three platforms use different state management patterns (web uses a flat `Record<number, string>`, mobile/extension use a `ValidationWord[]` array). A shared hook can be pursued separately.

### 2. Match the mobile/extension pattern exactly

The fix follows the exact same indexing pattern used by mobile (`apps/mobile/app/(auth)/create.tsx`) and extension (`apps/extension/src/pages/auth/CreateWalletPage.tsx`):
- `position={pos}` for display (positions are already 1-indexed)
- `words[pos - 1]` for array access (convert to 0-indexed)

## Risks / Trade-offs

- **[Minimal risk]** Two-line change with clear, verified root cause → No mitigation needed beyond code review
- **[Visual change]** Word numbers displayed will shift by -1 (e.g., "Word #5" → "Word #4") to show the correct positions → This is the correct behavior, matching mobile and extension
