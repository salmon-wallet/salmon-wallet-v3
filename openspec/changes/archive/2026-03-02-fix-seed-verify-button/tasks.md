## 1. Fix web app off-by-one indexing

- [x] 1.1 In `apps/web/src/pages/auth/CreatePage.tsx` line 177, change `position={pos + 1}` to `position={pos}`
- [x] 1.2 In `apps/web/src/pages/auth/CreatePage.tsx` line 182, change `words[pos]` to `words[pos - 1]`

## 2. Verify cross-platform consistency

- [x] 2.1 Confirm `apps/mobile/app/(auth)/create.tsx` uses `position={vw.position}` and `words[pos - 1]` (no changes needed)
- [x] 2.2 Confirm `apps/extension/src/pages/auth/CreateWalletPage.tsx` uses `position={vw.position}` and `words[pos - 1]` (no changes needed)

## 3. Typecheck

- [x] 3.1 Run `pnpm turbo run typecheck --filter=@salmon/web` to verify no type errors
