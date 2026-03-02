## MODIFIED Requirements

### Requirement: Component list for extraction
The following components SHALL be moved to `packages/ui`: `Button`, `Icon`, `PasswordInput`, `InputAddress`, `QRCode`, `SeedPhrase`, `StepIndicator`, `ScreenHeader`, `GradientBackground`, `TexturedBackground`, `ScalesBackground`, `BlurContainer`, `LoadingScreen`, `TokenList`, `TokenInfo`, `TokenFeatures`, `TokenAbout`, `TokenMarketData`, `PriceChart`, `BalanceCard`, `DerivedAccountCard`, `ConfirmDialog`, `CurrencySelector`, `LanguageSelector`, `ExplorerSelector`, `SupportSelector`, `TrustedAppsSelector`, `NetworkSelector`, `SettingsSelectorList`, `SettingsPageLayout`, `PageShell`, `BaseSheetDialog`, `BaseDialog`, `TokenSelector`, `TransactionDetailModal`, `NftCard`, `NftCarouselSection`, `NftDetailPage`, `NftSeeAllPage`, `TokenDetailPage`, `WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`, `SendPage`, `SwapScreen`, `BridgeScreen`, `ReceiveSheet`, `WalletSwitcherSheet`, `SettingsSheet`, `NftSendDialog`, `TransactionHistoryPage`.

The `BlurContainer` component in `packages/ui` SHALL support a `useGradientBorder` prop and render a CSS radial gradient border by default, consuming the `gradients.glassyBorder` token from `@salmon/shared`.

#### Scenario: All listed components exist in packages/ui
- **WHEN** checking `packages/ui/src/components/`
- **THEN** every component listed above has its own directory with an `index.ts` barrel export

#### Scenario: BlurContainer exports gradient border support
- **WHEN** importing `BlurContainer` from `@salmon/ui`
- **THEN** it accepts `useGradientBorder` prop
- **THEN** it renders a radial gradient border by default
