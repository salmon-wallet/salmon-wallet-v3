## Context

All 66+ mobile component directories sit flat at `apps/mobile/src/components/`. Related components are scattered. The barrel `index.ts` (379 lines) exports everything from flat paths. All consumer files import via the barrel, never directly from component paths.

## Goals / Non-Goals

**Goals:**
- Reduce root-level directory count by grouping related components under parent directories
- Fix the loose `SettingsHeaderContext.tsx` file
- Update all barrel exports and internal relative imports correctly
- Pass typecheck

**Non-Goals:**
- No `packages/ui` changes (web components stay where they are)
- No backward-compatibility re-exports
- No functional changes to any component

## Decisions

### D1: Directory structure after refactor

```
components/
  AccountPanels/
    AccountsPanel/
    AccountAddPanel/
    AccountEditPanel/
    AccountNamePanel/
    AccountAvatarPanel/
  AddressPanels/
    AddressBookPanel/
    AddressAddPanel/
    AddressEditPanel/
  SettingsSelectors/
    LanguageSelector/
    NetworkSelector/
    CurrencySelector/
    ExplorerSelector/
    SettingsSelectorList/
  TokenInformationSheet/
    TokenInformationSheet.tsx  (existing)
    TokenBadgesSection.tsx     (existing)
    types.ts                   (existing)
    index.ts                   (updated)
    TokenAbout/                (moved in)
    TokenFeatures/             (moved in)
    TokenInfo/                 (moved in)
    TokenMarketData/           (moved in)
  SettingsHeaderContext/
    SettingsHeaderContext.tsx   (moved from loose file)
    index.ts                   (new)
  ... (all other components stay flat)
```

### D2: Import update strategy

Since all consumers import from the barrel (`'../../../src/components'` or `@/components`), only these need updating:
1. **Barrel exports** in `components/index.ts` — change paths like `'./AccountsPanel'` → `'./AccountPanels/AccountsPanel'`
2. **Internal relative imports** — components inside moved groups that import siblings outside the group need one extra `../`:
   - Selectors: `'../SettingsScreenLayout'` → `'../../SettingsScreenLayout'`
   - AccountAddPanel: `'../SettingsHeaderContext'` → `'../../SettingsHeaderContext'`
   - Selectors: `'../SettingsSelectorList'` → `'./SettingsSelectorList'` (now sibling inside SettingsSelectors/)
   - TokenInformationSheet: `'../TokenAbout'` → `'./TokenAbout'`, `'../TokenMarketData'` → `'./TokenMarketData'`
   - TokenInformationSheet/types.ts: `'../TokenMarketData'` → `'./TokenMarketData'`
3. **SettingsHeaderContext consumers** — path stays `'../SettingsHeaderContext'` because directory resolution finds index.ts (no change needed for SettingsSheet, PrivateKeyPanel). But AccountAddPanel moves deeper so it becomes `'../../SettingsHeaderContext'`.

### D3: TokenInformationSheet index.ts update

The TokenInformationSheet barrel must re-export the sub-components so the main barrel can reference them:
- Main barrel: `export { TokenAbout } from './TokenInformationSheet/TokenAbout'`
- Or: main barrel exports from the sub-dir directly

We'll use direct paths from main barrel for clarity.

## Risks / Trade-offs

- [Git history] Moving directories loses per-file git history → Use `git mv` to preserve tracking
- [Many files touched] Single refactor touches barrel + ~8 internal imports → All mechanical, no logic changes

## Open Questions

None.
