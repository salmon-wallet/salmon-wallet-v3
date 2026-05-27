# web-home-page Specification

## Purpose

Wire the web HomePage to render the shared `@salmon/ui` building blocks (`WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`, `TokenList`, `WalletSwitcherSheet`, `SettingsSheet`) against real account/balance state and route navigation. The page SHALL surface Home/Collectibles/Swap tabs, drive network and account switching through `useAccountsContext`, and consult `useUserConfig().developerNetworks` to gate testnet networks and unverified tokens.

## Requirements

### Requirement: HomePage displays wallet header with account info
The HomePage SHALL render WalletHeader from `@salmon/ui` with the active account name, address (from `activeBlockchainAccount.getReceiveAddress()`), avatar, and refresh button wired to `useBalance().refresh`.

#### Scenario: User views home page with active account
- **WHEN** user navigates to `/home` with an unlocked wallet
- **THEN** WalletHeader displays the active account name, shortened address, avatar, and settings/wallet-switcher buttons

#### Scenario: User taps refresh
- **WHEN** user clicks the refresh button in WalletHeader
- **THEN** `useBalance().refresh()` is called and `refreshing` state shows a spinner

### Requirement: HomePage displays balance carousel
The HomePage SHALL render BalanceCardCarousel from `@salmon/ui` with blockchain balances built from `useBalance()` and `useAvailableNetworks()`. Network switching SHALL call `actions.changeNetwork()`.

#### Scenario: User views balances across blockchains
- **WHEN** HomePage loads with active account
- **THEN** BalanceCardCarousel shows balance cards for all available networks with USD totals and 24h change

#### Scenario: User swipes to different blockchain
- **WHEN** user swipes to a different blockchain in the carousel
- **THEN** `actions.changeNetwork(newNetworkId)` is called and TokenList updates to show tokens for the new network

### Requirement: HomePage displays action buttons
The HomePage SHALL render ActionButtonRow from `@salmon/ui` with Send navigating to `/send`, Receive opening ReceiveSheet, and Activity navigating to `/activity`.

#### Scenario: User taps Send
- **WHEN** user clicks Send button
- **THEN** app navigates to `/send`

#### Scenario: User taps Receive
- **WHEN** user clicks Receive button
- **THEN** ReceiveSheet opens as an overlay showing the active address and QR code

#### Scenario: User taps Activity
- **WHEN** user clicks Activity button
- **THEN** app navigates to `/activity`

### Requirement: HomePage displays token list
The HomePage SHALL render TokenList from `@salmon/ui` with tokens from `useBalance().tokens`, filtering spam tokens. Token press SHALL navigate to `/token/:address`.

#### Scenario: User views token list
- **WHEN** HomePage home tab is active with loaded balances
- **THEN** TokenList shows all non-spam tokens with logos, balances, and 24h price changes

#### Scenario: User taps a token
- **WHEN** user clicks a token in the list
- **THEN** app navigates to `/token/{tokenAddress}`

### Requirement: HomePage has 3 tabs (Home, Collectibles, Swap)
The HomePage SHALL have a tab bar with Home, Collectibles, and Swap tabs managed by local state.

#### Scenario: User switches tabs
- **WHEN** user clicks the Collectibles tab
- **THEN** the tab content switches to show NftCarouselSections grouped by blockchain

### Requirement: HomePage renders WalletSwitcherSheet
The HomePage SHALL render WalletSwitcherSheet as an overlay, opened via WalletHeader's wallet button.

#### Scenario: User opens wallet switcher
- **WHEN** user clicks the wallet icon in WalletHeader
- **THEN** WalletSwitcherSheet opens showing all accounts with the active one highlighted

#### Scenario: User switches account
- **WHEN** user selects a different account in WalletSwitcherSheet
- **THEN** `actions.changeAccount(accountId)` is called and balances reload

### Requirement: HomePage renders SettingsSheet
The HomePage SHALL render SettingsSheet as an overlay. Navigation items in SettingsSheet SHALL use `navigate('/settings/...')`.

#### Scenario: User opens settings
- **WHEN** user clicks settings icon in WalletHeader
- **THEN** SettingsSheet opens with navigation items for all settings pages

#### Scenario: User navigates to a settings page
- **WHEN** user clicks "Language" in SettingsSheet
- **THEN** app navigates to `/settings/language` and SettingsSheet closes

### Requirement: HomePage uses useUserConfig for developer mode
The HomePage SHALL use `useUserConfig()` to get `developerNetworks` flag, which controls whether unverified tokens and testnet networks are shown.

#### Scenario: Developer mode enabled
- **WHEN** developerNetworks is true
- **THEN** testnet networks appear in BalanceCardCarousel and unverified tokens appear in TokenList
