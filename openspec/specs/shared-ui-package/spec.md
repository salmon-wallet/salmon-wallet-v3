## ADDED Requirements

### Requirement: packages/ui workspace package exists
The monorepo SHALL contain a `packages/ui` workspace package (`@salmon/ui`) with its own `package.json`, `tsconfig.json`, and barrel exports. It MUST declare `react`, `@mui/material`, `@emotion/react`, `@emotion/styled`, and `@salmon/shared` as dependencies or peer dependencies.

#### Scenario: Package is resolvable in the monorepo
- **WHEN** any app runs `pnpm install`
- **THEN** `@salmon/ui` resolves to `packages/ui/src/index.ts` via workspace protocol

#### Scenario: Typecheck passes independently
- **WHEN** running `pnpm turbo run typecheck --filter=@salmon/ui`
- **THEN** the command exits with code 0 and no type errors

### Requirement: Shared UI components are extracted from extension
All React DOM + MUI components in `apps/extension/src/components/` that have zero `chrome.*` or `browser.*` API dependencies SHALL be moved to `packages/ui/src/components/`. Each component MUST retain its existing directory structure (PascalCase directory with barrel `index.ts`).

#### Scenario: Component moved to packages/ui
- **WHEN** a component like `TokenList/` exists in `packages/ui/src/components/`
- **THEN** it exports the same public API as it did from `apps/extension/src/components/`
- **THEN** it imports design tokens and hooks from `@salmon/shared` (not relative paths to extension)

#### Scenario: Extension-specific components remain in extension
- **WHEN** a component uses `chrome.*` or `browser.*` APIs (e.g., dApp pages, session key cache)
- **THEN** it remains in `apps/extension/` and is NOT moved to `packages/ui`

### Requirement: Extension imports updated to @salmon/ui
After extraction, `apps/extension` SHALL import all moved components from `@salmon/ui` instead of `@/components`. The extension MUST retain identical functionality — this is a pure import path migration.

#### Scenario: Extension builds after migration
- **WHEN** running `pnpm turbo run typecheck --filter=@salmon/extension`
- **THEN** the command exits with code 0
- **THEN** the extension popup renders identically to before the migration

#### Scenario: No duplicate component code
- **WHEN** a component exists in `packages/ui/src/components/`
- **THEN** it MUST NOT also exist in `apps/extension/src/components/` (no duplication)

### Requirement: Styled utility is shared via packages/ui
The `utils/styled.ts` helper (emotion styled re-export with transient prop support) SHALL be moved to `packages/ui/src/utils/styled.ts` and exported from the package barrel.

#### Scenario: Both apps use the same styled utility
- **WHEN** `apps/extension` or `apps/web` needs the styled helper
- **THEN** it imports from `@salmon/ui` (e.g., `import { styled } from '@salmon/ui'`)

### Requirement: Component list for extraction
The following components SHALL be moved to `packages/ui`: `Button`, `Icon`, `PasswordInput`, `InputAddress`, `QRCode`, `SeedPhrase`, `StepIndicator`, `ScreenHeader`, `GradientBackground`, `TexturedBackground`, `ScalesBackground`, `BlurContainer`, `LoadingScreen`, `TokenList`, `TokenInfo`, `TokenFeatures`, `TokenAbout`, `TokenMarketData`, `PriceChart`, `BalanceCard`, `DerivedAccountCard`, `ConfirmDialog`, `CurrencySelector`, `LanguageSelector`, `ExplorerSelector`, `SupportSelector`, `TrustedAppsSelector`, `NetworkSelector`, `SettingsSelectorList`, `SettingsPageLayout`, `PageShell`, `BaseSheetDialog`, `BaseDialog`, `TokenSelector`, `TransactionDetailModal`, `NftCard`, `NftCarouselSection`, `NftDetailPage`, `NftSeeAllPage`, `TokenDetailPage`, `WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`, `SendPage`, `SwapScreen`, `BridgeScreen`, `ReceiveSheet`, `WalletSwitcherSheet`, `SettingsSheet`, `NftSendDialog`, `TransactionHistoryPage`.

#### Scenario: All listed components exist in packages/ui
- **WHEN** checking `packages/ui/src/components/`
- **THEN** every component listed above has its own directory with an `index.ts` barrel export

### Requirement: Components use design tokens for font sizes
All components in `packages/ui/src/components/` SHALL use `fontSize.*` token references from `@salmon/shared` for every `fontSize` style property. Raw numeric values for fontSize SHALL NOT be used.

#### Scenario: Component imports fontSize token
- **WHEN** a component in `packages/ui` needs to set a font size
- **THEN** it imports `fontSize` from `@salmon/shared` and uses a token reference (e.g., `fontSize.sm`, `fontSize.base`, `fontSize.md`)

#### Scenario: No raw numeric fontSize values
- **WHEN** reviewing any `.tsx` or `.ts` file in `packages/ui/src/`
- **THEN** no `fontSize` property has a raw numeric value without a token reference

### Requirement: Components use design tokens for spacing
All components in `packages/ui/src/components/` SHALL use `spacing.*` token references from `@salmon/shared` for every spacing property (padding, margin, gap). Raw numeric values for spacing SHALL NOT be used.

#### Scenario: Component imports spacing token
- **WHEN** a component in `packages/ui` needs to set spacing
- **THEN** it imports `spacing` from `@salmon/shared` and uses a token reference

#### Scenario: No raw numeric spacing values
- **WHEN** reviewing any `.tsx` or `.ts` file in `packages/ui/src/`
- **THEN** no spacing property has a raw numeric value without a token reference
