# Tasks: fix-web-responsive-sizing

## 1. Search & Reuse Audit

- [x] Confirm `packages/shared/src/utils/scaling.ts` is the web scaling implementation
- [x] Confirm `packages/shared/src/utils/scaling.native.ts` is the mobile implementation (not touched)
- [x] Confirm `packages/ui/src/layouts/WalletLayout.tsx` has the `maxWidth` default
- [x] Verify no other files override or re-implement scaling functions

## 2. packages/shared — Cap scaling dimensions

- [x] In `packages/shared/src/utils/scaling.ts`, add `MAX_SCALING_WIDTH = DESIGN_WIDTH` and `MAX_SCALING_HEIGHT = DESIGN_HEIGHT` constants
- [x] Modify `getDimensions()` to cap `_width` at `MAX_SCALING_WIDTH` and `_height` at `MAX_SCALING_HEIGHT` using `Math.min()`
- [x] Ensure the fallback path (when `window` is unavailable) remains unchanged

## 3. packages/ui — Reduce WalletLayout maxWidth

- [x] In `packages/ui/src/layouts/WalletLayout.tsx`, change default `maxWidth` from `500` to `375`

## 4. Verification

- [x] Run typecheck: `pnpm turbo run typecheck`
- [x] Run lint: `pnpm turbo run lint`
- [x] Run build: `pnpm turbo run build`
