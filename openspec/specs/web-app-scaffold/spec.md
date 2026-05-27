# web-app-scaffold Specification

## Purpose

Stand up the `apps/web` workspace package as a Vite + React 19 app that mirrors the extension's runtime: react-native and react-native-fast-crypto stubs, Buffer/global polyfills, web-platform storage and stash initialization, the same provider hierarchy as extension, i18next with browser detection, `VITE_*` environment variables, and turbo task graph integration so shared and ui packages build before web.

## Requirements

### Requirement: apps/web workspace package exists
The monorepo SHALL contain an `apps/web` workspace package (`@salmon/web`) with `package.json`, `tsconfig.json`, `vite.config.ts`, and `index.html`. It MUST use Vite as its build tool with `@vitejs/plugin-react`.

#### Scenario: Dev server starts
- **WHEN** running `pnpm --filter @salmon/web dev`
- **THEN** a Vite dev server starts and serves the app on a local port

#### Scenario: Production build succeeds
- **WHEN** running `pnpm --filter @salmon/web build`
- **THEN** a `dist/` directory is produced with static HTML, JS, and CSS files

### Requirement: React Native stubs configured
Vite SHALL resolve `react-native` and `react-native-fast-crypto` imports to local stub files via aliases. The stubs MUST provide mock implementations for `Dimensions`, `Platform`, and `Linking` (matching the extension's existing stubs). The `react-native-fast-crypto` stub MUST export `pbkdf2` as `undefined` to trigger the crypto-js fallback.

#### Scenario: Shared package imports resolve
- **WHEN** `@salmon/shared` imports from `react-native` at build time
- **THEN** Vite resolves to `apps/web/src/stubs/react-native.ts` without errors

#### Scenario: PBKDF2 uses crypto-js fallback
- **WHEN** the web app derives an encryption key via `@salmon/shared/crypto`
- **THEN** it uses the crypto-js PBKDF2 implementation (not native)

### Requirement: Buffer and global polyfills
Vite config SHALL define `global` as `globalThis` and provide `Buffer` polyfill via the `buffer` package. This MUST be available before any Solana or crypto library code executes.

#### Scenario: Solana libraries work
- **WHEN** `@solana/web3.js` is imported in the web app
- **THEN** it finds `Buffer` and `global` without runtime errors

### Requirement: Storage initialized for web platform
The app entry point (`main.tsx`) SHALL call `initStorage({ platform: 'web' })` and `initStash('web')` before rendering the React tree. This MUST use the existing `createLocalStorageAdapter()` from `@salmon/shared`.

#### Scenario: Storage persists across page reloads
- **WHEN** a user creates a wallet and reloads the page
- **THEN** the encrypted account data is still available in localStorage

#### Scenario: Stash clears on tab close
- **WHEN** a user closes the browser tab
- **THEN** the in-memory stash (passwords, derived keys) is lost

### Requirement: Provider hierarchy matches extension
The React tree SHALL wrap the app in the same provider order as the extension: `I18nextProvider` > `AccountsProvider` > `CurrencyProvider` > `App`.

#### Scenario: Hooks work in web app
- **WHEN** a component calls `useAccountsContext()` or `useCurrencyContext()`
- **THEN** it receives the same state shape and actions as in the extension

### Requirement: i18n configuration
The web app SHALL initialize i18next with browser language detection, using the same translation files from `@salmon/shared/locales/`. It MUST support `en` and `es` locales.

#### Scenario: Language detected
- **WHEN** a user with browser language `es` opens the web app
- **THEN** the UI renders in Spanish

### Requirement: Environment variables
The web app SHALL read `VITE_API_URL`, `VITE_STATIC_API_URL`, `VITE_HELIUS_API_KEY`, and `VITE_SALMON_ENV` from `.env` files. An `.env.example` MUST document all required variables.

#### Scenario: API client uses correct URL
- **WHEN** the app makes API requests
- **THEN** it uses the URL from `VITE_API_URL`

### Requirement: Turbo integration
`turbo.json` SHALL include `@salmon/web` in its task graph. The `dev` task MUST be persistent and non-cached. The `build` and `typecheck` tasks MUST depend on `^build` and `^typecheck` respectively.

#### Scenario: Turbo orchestrates builds
- **WHEN** running `pnpm turbo run build`
- **THEN** `@salmon/shared` and `@salmon/ui` build before `@salmon/web`
