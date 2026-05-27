## 1. Replace borderWidth: 0.5 and borderWidth={0.5} with borderWidth.actionButton

- [ ] 1.1 `NftCard/NftCard.tsx` — line 133: `borderWidth={0.5}` → `borderWidth={borderWidth.actionButton}`, add `borderWidth` to import
- [ ] 1.2 `NftCarouselSection/NftCarouselSection.tsx` — line 127: `borderWidth={0.5}` → `borderWidth={borderWidth.actionButton}`, add `borderWidth` to import
- [ ] 1.3 `NftDetailSheet/NftDetailSheet.tsx` — line 401: `borderWidth={0.5}` → `borderWidth={borderWidth.actionButton}`, line 581: `borderWidth: 0.5` → `borderWidth: borderWidth.actionButton`, add `borderWidth` to import

## 2. Replace borderWidth: 1 with borderWidth.thin

- [ ] 2.1 `SendSheet/StepAddressAmount.tsx` — lines 381, 385, 389, 524, 541: replace all `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.2 `SendSheet/StepConfirmation.tsx` — lines 282, 298: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.3 `TransactionDetailModal/TransactionDetailModal.tsx` — lines 1163, 1204, 1240, 1305: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.4 `NftDetailSheet/NftDetailSheet.tsx` — lines 441, 484: replace `borderWidth: 1` → `borderWidth: borderWidth.thin` (import already added in task 1.3)
- [ ] 2.5 `LockScreenOverlay/LockScreenOverlay.tsx` — line 565: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.6 `InputAddress/InputAddress.tsx` — line 243: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.7 `PasswordInput/PasswordInput.tsx` — line 81: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.8 `SeedPhrase/SeedWordInput.tsx` — line 73: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.9 `SeedPhrase/SeedWordGrid.tsx` — line 38: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.10 `AccountNamePanel/AccountNamePanel.tsx` — line 95: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.11 `AccountsPanel/AccountsPanel.tsx` — line 299: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.12 `AccountAddPanel/AccountAddPanel.tsx` — lines 373, 384: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.13 `DerivedAccountCard/DerivedAccountCard.tsx` — line 79: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.14 `DerivedAccountCard/DerivedAccountCardSkeleton.tsx` — line 112: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.15 `TokenSelector/TokenSelector.tsx` — line 155: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.16 `NetworkSelector/NetworkSelector.tsx` — line 108: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.17 `ExplorerSelector/ExplorerSelector.tsx` — line 108: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.18 `LanguageSelector/LanguageSelector.tsx` — line 94: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.19 `WalletSwitcherSheet/WalletSwitcherSheet.tsx` — line 490: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.20 `BridgeScreen/BridgeReviewScreen.tsx` — line 137: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.21 `BridgeScreen/BridgeRecipientScreen.tsx` — line 118: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.22 `TransactionHistorySheet/AddressCopyRow.tsx` — line 159: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.23 `GlassTabBar/GlassTabBar.tsx` — line 96: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import
- [ ] 2.24 `GlassTabBar/GlassTabBar.native.tsx` — line 119: replace `borderWidth: 1` → `borderWidth: borderWidth.thin`, add `borderWidth` to import

## 3. Replace borderWidth: 2 with borderWidth.medium

- [ ] 3.1 `AvatarPicker/AvatarPicker.tsx` — lines 238, 254: replace `borderWidth: 2` → `borderWidth: borderWidth.medium`, add `borderWidth` to import
- [ ] 3.2 `TransactionHistorySheet/TransactionItem.tsx` — lines 430, 448: replace `borderWidth: 2` → `borderWidth: borderWidth.medium`, add `borderWidth` to import

## 4. Handle borderWidth: 0

- [ ] 4.1 `TransactionDetailModal/TransactionDetailModal.tsx` — lines 999, 1116: keep `borderWidth: 0` as-is (no token for zero, explicit reset is intentional)

## 5. Verify

- [ ] 5.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/mobile`
- [ ] 5.2 Verify no remaining hardcoded borderWidth values with grep
