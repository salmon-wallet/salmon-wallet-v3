## Context

Salmon Wallet is a monorepo with two consumer apps (`apps/extension` using WXT+Vite+React DOM+MUI, `apps/mobile` using Expo+React Native) and shared packages (`packages/shared` for business logic, `packages/assets` for static resources). The extension already has ~55 React DOM components built with MUI 7 + Emotion that share business logic via `@salmon/shared`.

The goal is to create a standalone web app (`apps/web`) that reuses both the shared business logic AND the extension's UI components. To avoid coupling `apps/web` directly to `apps/extension`, shared components will be extracted into a new `packages/ui` package.

**Current architecture constraints:**
- Extension components are hardcoded for ~400x600px popup viewport
- Extension uses state-machine navigation (no react-router), with 18+ views managed via `useState` in `HomePage.tsx`
- 8-9 files use `chrome.*` / `browser.*` APIs directly
- `BaseSheetDialog` SIZE_PRESETS locked to 360-440px max-width
- `PageShell` uses `height: 100vh` assuming popup context

## Goals / Non-Goals

**Goals:**
- Create `packages/ui` (`@salmon/ui`) with all platform-agnostic React DOM components
- Create `apps/web` (`@salmon/web`) as a Vite SPA consuming `@salmon/shared` + `@salmon/ui`
- Implement URL-based routing with react-router-dom v7 and auth guards
- Make extracted components responsive (320px mobile to 1920px+ desktop)
- Implement Solana Wallet Standard dApp connection for the web app
- Keep `apps/extension` fully functional after migration (only import paths change)

**Non-Goals:**
- SSR / server-side rendering (wallet is a client-side authenticated app, no SEO needed)
- Sharing components with `apps/mobile` (React Native uses different primitives)
- Redesigning the visual identity or adding new features — parity with extension UI
- Supporting browsers without ES2022 (Vite baseline)
- WalletConnect v2 integration (future enhancement beyond wallet-standard)

## Decisions

### D1: Vite SPA over Expo Web or Next.js

**Decision:** Use standalone Vite for `apps/web`.

**Rationale:** Extension components are already React DOM + MUI + Emotion. Using Expo Web would introduce react-native-web translation layer (+500KB bundle overhead, inferior animation performance). Next.js adds server complexity unnecessary for an authenticated SPA. Vite matches the extension's existing bundler (via WXT), so polyfill configs, aliases, and patterns are directly portable.

**Alternatives rejected:**
- Expo Web: 2-3x bundle size overhead, react-native-web abstraction layer, less mature for web
- Next.js: SSR complexity for zero SEO benefit, different bundler ecosystem

### D2: Extract to `packages/ui` (not import from extension)

**Decision:** Create new `packages/ui` workspace package; move components there.

**Rationale:** Importing directly from `apps/extension/src/` couples web to extension and creates fragile cross-app dependencies. A shared package with its own `package.json` is the established monorepo pattern (matches how `packages/shared` works). It also enables independent versioning and dependency management.

**Migration path:** Move component directories from `apps/extension/src/components/` to `packages/ui/src/components/`. Update `apps/extension` imports from `@/components` to `@salmon/ui`. Verify typecheck passes. Then `apps/web` imports from `@salmon/ui` identically.

### D3: Centered wallet layout (max-width 500px) over full-width responsive

**Decision:** The web app uses a centered container with `max-width: 500px`, not a full-width responsive layout.

**Rationale:** Wallet content (token lists, balance cards, send forms) doesn't benefit from wide layouts. This matches MetaMask Portfolio, Phantom web, and Backpack. It minimizes responsive adaptations needed — most extension components already work at 400-440px width, so centering them at ~500px requires minimal changes. The SIZE_PRESETS in dialogs only need viewport-clamping (`min(440px, 95vw)`) for mobile, not full responsive redesign.

### D4: React Router v7 with flat route structure

**Decision:** Use react-router-dom v7 with `createBrowserRouter` and a flat route file.

**Rationale:** The extension's state-machine pattern (18+ `PageView` values in `HomePage.tsx`) doesn't translate to URL-based navigation. React Router provides URL state, back/forward support, deep linking, and auth guards. v7 is already a dependency of the extension. A flat route structure (not file-based) keeps routing explicit and portable.

**Route guards:** `AuthGuard` component wraps protected routes, checking `useAccountsContext()` state for `ready`, `locked`, and `accounts.length`.

### D5: Solana Wallet Standard for dApp connection

**Decision:** Register as a wallet-standard wallet; use popup-based approval flow with `BroadcastChannel` for cross-window communication.

**Rationale:** Wallet-standard is the modern Solana ecosystem standard (replaces the old wallet-adapter interface). It allows dApps using `@solana/wallet-adapter` to discover Salmon automatically. The popup flow (dApp opens Salmon web app in a popup → user approves → result sent back via BroadcastChannel) mirrors the extension's popup pattern conceptually.

**Alternatives rejected:**
- WalletConnect v2: Additional server dependency (relay), more complex, can be added later
- Same-window injection: Not possible for cross-origin dApps

### D6: Stubs for react-native modules

**Decision:** Copy the existing stubs from `apps/extension/src/stubs/` to `apps/web/src/stubs/` and configure Vite aliases.

**Rationale:** `@salmon/shared` has optional peer dependencies on `react-native` and `react-native-fast-crypto`. The extension already solved this with stubs that provide `Dimensions`, `Platform`, `Linking` mocks and `pbkdf2 = undefined` (triggering crypto-js fallback). The web app needs identical stubs. Copying rather than sharing avoids another package for 2 small files.

**Vite aliases:** `react-native` → `./src/stubs/react-native.ts`, `react-native-fast-crypto` → `./src/stubs/react-native-fast-crypto.ts`

### D7: `sessionStorage` for session key cache

**Decision:** Replace `chrome.storage.session` with browser `sessionStorage` for the web app's session key cache.

**Rationale:** The extension uses `chrome.storage.session` to persist derived keys across popup reopens within the same browser session. In the web app, `sessionStorage` provides equivalent behavior — data persists for the tab's lifetime and clears on tab close. This is acceptable for caching PBKDF2 derived keys (the password is never stored).

## Risks / Trade-offs

**[R1] Security: localStorage for encrypted mnemonics** → Mitigation: All mnemonics are encrypted with PBKDF2-derived keys before storage (existing pattern in `@salmon/shared/crypto/encryption.ts`). localStorage is no less secure than chrome.storage.local for encrypted data. Add a warning banner on first use explaining browser security limitations.

**[R2] Large refactoring scope for `packages/ui` extraction** → Mitigation: The extraction is mechanical (move files, update imports). Do it in a single atomic commit per component batch. Run typecheck after each batch. Extension functionality must remain identical — this is a pure refactoring.

**[R3] HomePage.tsx is 1100+ lines with 18+ views in state** → Mitigation: Don't refactor HomePage itself. Create thin page wrappers in `apps/web/src/pages/` that render the same child components with react-router navigation instead of state-based navigation. The child components (TokenDetailPage, SettingsSheet, etc.) move to `@salmon/ui` unchanged.

**[R4] dApp popup flow may be blocked by popup blockers** → Mitigation: The popup is opened in response to a user click (wallet-adapter connect button), which browsers allow. Add fallback to redirect-based flow if popup is blocked.

**[R5] Bundle size from MUI + crypto dependencies** → Mitigation: Use tree-shaking (MUI v7 supports it with direct imports like `@mui/material/Button`). Lazy-load crypto-heavy routes (send, swap) with `React.lazy()`. Target < 500KB gzipped initial load.

## Open Questions

- **Q1:** Should `packages/ui` include the `utils/styled.ts` helper (re-export of emotion's styled with transient prop support), or should each app import from `@emotion/styled` directly?
- **Q2:** For dApp connection, should the approval popup be a separate route in the same web app (`/dapp/approve`) or a minimal standalone HTML page for faster loading?
