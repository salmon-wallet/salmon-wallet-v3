## Why

Salmon Wallet currently exists as a mobile app (Expo) and a browser extension (WXT+Vite), but has no standalone web app. A web version would expand reach to users who prefer browser-based wallets without installing an extension. The extension already has ~55 React DOM + MUI components and shares business logic via `@salmon/shared` — these can be leveraged to build the web app with high code reuse. To enable this reuse without coupling `apps/web` to `apps/extension`, the shared UI components need to be extracted into a new `packages/ui` package first.

## What Changes

- **New package `packages/ui` (`@salmon/ui`)**: Extract ~45 React DOM + MUI components from `apps/extension/src/components/` into a shared UI package. Both `apps/extension` and `apps/web` will consume from `@salmon/ui`.
- **New app `apps/web` (`@salmon/web`)**: Vite SPA with React 19, MUI 7, Emotion, react-router-dom v7. Uses `@salmon/shared` for business logic and `@salmon/ui` for UI components.
- **URL-based routing**: Replace the extension's state-machine navigation pattern with react-router-dom file-based routes and an auth guard.
- **Responsive layout**: New `WalletLayout` component with centered max-width container (500px). Update dialog/sheet size presets from hardcoded 360-440px to viewport-responsive values.
- **Web dApp connection**: Implement Solana Wallet Standard registration so external dApps can discover and connect to the Salmon web wallet via popup/redirect flow using `postMessage` / `BroadcastChannel`.
- **Chrome API removal in shared components**: All components moved to `packages/ui` must have zero `chrome.*` / `browser.*` dependencies. Extension-specific files (`entrypoints/`, `pages/dapp/`, `utils/sessionKeyCache.ts`) remain in `apps/extension`.
- **BREAKING**: `apps/extension` import paths change from `@/components` to `@salmon/ui` for all extracted components.

## Capabilities

### New Capabilities
- `shared-ui-package`: Extraction of React DOM + MUI components from `apps/extension/src/components/` into `packages/ui`, including package setup, barrel exports, and updating `apps/extension` imports.
- `web-app-scaffold`: Setup of `apps/web` with Vite, React, stubs, polyfills, storage initialization, i18n, and provider hierarchy. The foundation that makes the web app boot and render.
- `web-app-routing`: React Router configuration for `apps/web` with auth guard, route definitions for all wallet screens (auth, home, token detail, NFT, send, settings, etc.), and navigation patterns.
- `responsive-wallet-layout`: New `WalletLayout` wrapper component, responsive dialog/sheet size presets, and viewport-aware adjustments to `PageShell`, `BaseSheetDialog`, `NftCarouselSection`, and other layout components.
- `web-dapp-connection`: Solana Wallet Standard registration, popup-based approval flow, `postMessage`/`BroadcastChannel` bridge for cross-window communication, and approval UI pages.

### Modified Capabilities
_(none — existing specs are unaffected; the extension retains its current behavior)_

## Impact

**Packages affected**:
- `packages/ui` (NEW) — new workspace package with ~45 components extracted from extension
- `packages/shared` — no code changes, but consumed by a new app (`apps/web`)
- `apps/extension` — import path migration from `@/components` to `@salmon/ui` (no functional changes)
- `apps/web` (NEW) — new Vite SPA application

**Dependencies added**:
- `apps/web`: `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `i18next`, `react-i18next`, `buffer`
- `apps/web` (dApp): `@solana/wallet-standard-features`, `@wallet-standard/base`, `@wallet-standard/features`
- `packages/ui`: `react`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `@salmon/shared`

**Monorepo config**:
- `pnpm-workspace.yaml` — already includes `packages/*` (no change needed)
- `turbo.json` — may need `@salmon/ui` and `@salmon/web` task entries
- Root `package.json` — add convenience scripts for web app dev/build

**Build/CI**:
- New typecheck target: `@salmon/ui`
- New build target: `@salmon/web`
- Extension build must verify no regressions after import migration

**Security considerations**:
- Web storage (`localStorage`) is inherently less secure than `chrome.storage.local` — private keys are encrypted with PBKDF2 before storage (existing pattern)
- dApp approval flow must prevent clickjacking and origin spoofing (validate `postMessage` origins)
- `sessionStorage` for session key cache clears on tab close (acceptable for web)
