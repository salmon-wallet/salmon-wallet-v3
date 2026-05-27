## 1. Extension — Hardcoded Colors & Typography

- [x] 1.1 Fix `apps/extension/src/entrypoints/popup/App.tsx` — replace `#0f0f0f`, `#FF6B4A`, `rgba(255,107,74,...)` spinner styles with `colors.background.primary`, `colors.accent.primary`, `colors.accent.tint` tokens
- [x] 1.2 Fix `apps/extension/src/pages/home/HomePage.tsx` — replace `rgba(255,255,255,0.05)` → `colors.background.card`, `rgba(255,255,255,0.4)` → `colors.text.disabled`, `borderRadius: 12` → `borderRadius.lg`, hardcoded `fontSize` (14, 12, 20, 18) → tokens, inline `style={{ marginTop: 24, marginBottom: 24 }}` → spacing tokens
- [x] 1.3 Fix `apps/extension/src/pages/collectibles/CollectiblesPage.tsx` — replace `rgba(255,255,255,0.05)` → `colors.background.card`, `rgba(255,255,255,0.4)` → `colors.text.disabled`, `borderRadius: 12` → `borderRadius.lg`, hardcoded `fontSize` (18, 14, 12, 16) → tokens
- [x] 1.4 Fix `apps/extension/src/pages/swap/SwapPage.tsx` — replace `fontSize: 16` → `fontSize.md`
- [x] 1.5 Fix `apps/extension/src/pages/lock/LockPage.tsx` — replace hardcoded `width: 72`, `height: 72`, `padding: '14px 16px'` with `componentSizes`/`spacing` tokens

## 2. Extension — Styling Consistency (sx → styled)

- [x] 2.1 In `apps/extension/src/pages/home/HomePage.tsx` — convert inline `sx={{ fontSize: 20 }}`, `sx={{ fontSize: 18, fontWeight: 600 }}` and similar `sx` props to `styled()` components or token-based props
- [x] 2.2 In `apps/extension/src/pages/collectibles/CollectiblesPage.tsx` — convert `sx={{ width: 24, height: 24 }}` to token-based prop

## 3. Web — Hardcoded Values

- [x] 3.1 Fix `apps/web/src/pages/home/HomePage.tsx` — replace `borderRadius: 12` → `borderRadius.lg`, inline `style={{ marginTop: 24, marginBottom: 24 }}` → spacing tokens
- [x] 3.2 Fix `apps/web/src/pages/home/SwapTab.tsx` — replace 3x `window.alert()` with `console.error()` (proper toast system is a separate task)

## 4. Verification

- [x] 4.1 Run `npx turbo run typecheck --filter=@salmon/extension --filter=@salmon/web` — must pass clean
- [x] 4.2 Run `npx turbo run lint --filter=@salmon/extension --filter=@salmon/web` — must pass clean with 0 errors
