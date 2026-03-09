# Mobile Component Grouping

Restructure `apps/mobile/src/components/` to group related components under parent directories.

## Requirements

### R1: AccountPanels group
Move into `AccountPanels/`: AccountsPanel, AccountAddPanel, AccountEditPanel, AccountNamePanel, AccountAvatarPanel. Each keeps its directory structure intact.

### R2: AddressPanels group
Move into `AddressPanels/`: AddressBookPanel, AddressAddPanel, AddressEditPanel.

### R3: SettingsSelectors group
Move into `SettingsSelectors/`: LanguageSelector, NetworkSelector, CurrencySelector, ExplorerSelector, SettingsSelectorList.

### R4: TokenInformationSheet absorption
Move TokenAbout/, TokenFeatures/, TokenInfo/, TokenMarketData/ inside the existing `TokenInformationSheet/` directory as sub-directories.

### R5: SettingsHeaderContext directory
Move the loose `SettingsHeaderContext.tsx` into `SettingsHeaderContext/SettingsHeaderContext.tsx` with a new `index.ts` barrel.

### R6: Barrel export updates
Update `apps/mobile/src/components/index.ts` to reflect new paths. No re-exports from old paths.

### R7: Internal import updates
Fix all relative imports broken by the moves:
- Selectors importing SettingsScreenLayout: `'../SettingsScreenLayout'` → `'../../SettingsScreenLayout'`
- Selectors importing SettingsSelectorList: `'../SettingsSelectorList'` → `'./SettingsSelectorList'` (now co-located)
- AccountAddPanel importing SettingsHeaderContext: `'../SettingsHeaderContext'` → `'../../SettingsHeaderContext'`
- TokenInformationSheet.tsx importing TokenAbout/TokenMarketData: `'../TokenAbout'` → `'./TokenAbout'`, `'../TokenMarketData'` → `'./TokenMarketData'`
- TokenInformationSheet/types.ts importing MarketData: `'../TokenMarketData'` → `'./TokenMarketData'`

### R8: Typecheck
Must pass `pnpm turbo run typecheck --filter=@salmon/mobile` after all changes.
