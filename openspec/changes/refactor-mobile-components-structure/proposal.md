## Why

The mobile components directory has 66+ flat directories at the root level. Related components that always work together (account panels, address panels, settings selectors, token info sub-components) are scattered as siblings, making navigation harder. A loose `SettingsHeaderContext.tsx` file breaks the directory convention.

## What Changes

- **Group Account panels** into `AccountPanels/` parent directory (5 components)
- **Group Address panels** into `AddressPanels/` parent directory (3 components)
- **Group Settings selectors** into `SettingsSelectors/` parent directory (5 components including SettingsSelectorList)
- **Move Token sub-components** into `TokenInformationSheet/` (4 components that are sub-sections of that sheet)
- **Wrap `SettingsHeaderContext.tsx`** in its own `SettingsHeaderContext/` directory with barrel export
- **Update all internal relative imports** and barrel exports — no re-exports, no backward compatibility
- **Scope: `apps/mobile/src/components/` only** — `packages/ui` is not affected

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `apps/mobile/src/components/` — directory restructure, barrel export updates
- Internal relative imports between components (SettingsScreenLayout, SettingsHeaderContext, SettingsSelectorList, TokenAbout, TokenMarketData references)
- No consumer-facing changes — all consumers import via barrel `'../../../src/components'`
- No `packages/ui` or `packages/shared` changes
