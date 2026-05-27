## 1. Font files

- [x] 1.1 Create `apps/web/public/fonts/` directory
- [x] 1.2 Copy the 7 DM Sans `.ttf` files from `packages/assets/src/fonts/` to `apps/web/public/fonts/`: `DMSans-Light.ttf`, `DMSans-Regular.ttf`, `DMSans-Medium.ttf`, `DMSans-SemiBold.ttf`, `DMSans-Bold.ttf`, `DMSans-ExtraBold.ttf`, `DMSans-Black.ttf`

## 2. CSS @font-face declarations

- [x] 2.1 Create `apps/web/src/assets/fonts.css` with 7 `@font-face` blocks — one per weight (300, 400, 500, 600, 700, 800, 900), all with `font-family: 'DM Sans'`, `font-display: swap`, `font-style: normal`, and `src: url('/fonts/DMSans-<Variant>.ttf') format('truetype')`

## 3. Entry point import

- [x] 3.1 Add `import './assets/fonts.css'` to `apps/web/src/main.tsx` before the `ReactDOM.createRoot` call

## 4. Verification

- [x] 4.1 Run `pnpm web:build` and verify font files appear in `dist/fonts/` with original names (no hash)
- [x] 4.2 Run `pnpm web:dev` and verify DM Sans renders in browser DevTools computed styles
