## 1. SettingsHeaderContext (loose file → directory)

- [x] 1.1 Create `SettingsHeaderContext/` directory, move `SettingsHeaderContext.tsx` into it, create `index.ts` barrel export

## 2. AccountPanels group

- [x] 2.1 Create `AccountPanels/` directory, move AccountsPanel/, AccountAddPanel/, AccountEditPanel/, AccountNamePanel/, AccountAvatarPanel/ into it
- [x] 2.2 Fix AccountAddPanel internal imports: SettingsHeaderContext, SettingsScreenLayout, Button, DerivedAccountCard, LoadingScreen → `'../../'`

## 3. AddressPanels group

- [x] 3.1 Create `AddressPanels/` directory, move AddressBookPanel/, AddressAddPanel/, AddressEditPanel/ into it
- [x] 3.2 Fix all AddressPanels internal imports: SettingsScreenLayout, InputAddress → `'../../'`

## 4. SettingsSelectors group

- [x] 4.1 Create `SettingsSelectors/` directory, move LanguageSelector/, NetworkSelector/, CurrencySelector/, ExplorerSelector/, SettingsSelectorList/ into it
- [x] 4.2 Fix all 4 selectors internal import: `'../SettingsScreenLayout'` → `'../../SettingsScreenLayout'`
- [x] 4.3 SettingsSelectorList import stays `'../SettingsSelectorList'` (sibling within SettingsSelectors/)

## 5. TokenInformationSheet absorption

- [x] 5.1 Move TokenAbout/, TokenFeatures/, TokenInfo/, TokenMarketData/ inside TokenInformationSheet/
- [x] 5.2 Fix TokenInformationSheet.tsx imports: `'../TokenAbout'` → `'./TokenAbout'`, `'../TokenMarketData'` → `'./TokenMarketData'`
- [x] 5.3 Fix TokenInformationSheet/types.ts import: `'../TokenMarketData'` → `'./TokenMarketData'`
- [x] 5.4 Main barrel references sub-components directly via `'./TokenInformationSheet/TokenAbout'` etc.

## 6. Barrel export updates

- [x] 6.1 Update `apps/mobile/src/components/index.ts` — all export paths reflect new structure
- [x] 6.2 Reorganized by category: Foundation, Layout, Sheets, Home, Token Detail, NFT, Transaction, Send/Swap/Bridge, Settings, Account Management, Address Book, Security

## 7. Typecheck

- [x] 7.1 Run typecheck — passed (fixed BlurContainer imports in TokenAbout and TokenMarketData)
