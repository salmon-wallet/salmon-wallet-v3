## MODIFIED Requirements

### Requirement: Component list for extraction
The following components SHALL be moved to `packages/ui`: `Button`, `Icon`, `PasswordInput`, `InputAddress`, `QRCode`, `SeedPhrase`, `StepIndicator`, `ScreenHeader`, `GradientBackground`, `TexturedBackground`, `ScalesBackground`, `BlurContainer`, `LoadingScreen`, `TokenList`, `TokenInfo`, `TokenFeatures`, `TokenAbout`, `TokenMarketData`, `PriceChart`, `BalanceCard`, `DerivedAccountCard`, `ConfirmDialog`, `CurrencySelector`, `LanguageSelector`, `ExplorerSelector`, `SupportSelector`, `TrustedAppsSelector`, `NetworkSelector`, `SettingsSelectorList`, `SettingsPageLayout`, `PageShell`, `BaseSheetDialog`, `BaseDialog`, `TokenSelector`, `TransactionDetailModal`, `NftCard`, `NftCarouselSection`, `NftDetailPage`, `NftSeeAllPage`, `TokenDetailPage`, `WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`, `SendPage`, `SwapScreen`, `BridgeScreen`, `ReceiveSheet`, `WalletSwitcherSheet`, `SettingsSheet`, `NftSendDialog`, `TransactionHistoryPage`, `AccountsPage`, `AccountEditPage`, `AccountNamePage`, `AccountAvatarPage`, `AccountAddPage`, `SecurityPage`, `BackupPage`, `PrivateKeyPage`, `AddressBookPage`, `AddressAddPage`, `AddressEditPage`, `AboutPage`.

#### Scenario: All listed components exist in packages/ui
- **WHEN** checking `packages/ui/src/components/`
- **THEN** every component listed above has its own directory with an `index.ts` barrel export
