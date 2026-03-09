## Why

Settings sub-options currently navigate to full-page views (extension uses state-based page switching, web uses URL routing, mobile uses Expo Router stack screens). This breaks the spatial context — the user loses sight of the settings menu and gets teleported to a different "place". Replacing page navigation with stacking side panels keeps the user within the settings context, creating a more cohesive and fluid experience across all platforms.

## What Changes

- **New `SettingsPanelStack` component** in `packages/ui` (extension/web): A generic stacking panel system built on MUI Drawer that manages a stack of panels sliding in from the right, each overlaying the previous one. Back action pops the top panel with a reverse slide animation.
- **New `SettingsPanelStack` component** in `apps/mobile` (React Native): Equivalent panel stack using react-native-reanimated for native slide animations and gesture-based dismiss.
- **Refactor `SettingsSheet`** (both platforms): Instead of calling `onNavigate` which triggers external page navigation, the sheet becomes the first panel in the stack and pushes sub-panels internally.
- **Recycle existing settings content components**: All selector/page components (`LanguageSelector`, `CurrencySelector`, `AccountsPage`, `SecurityPage`, etc.) remain as-is — they already accept `onBack` callbacks and render self-contained content. They just get mounted inside panels instead of pages.
- **Remove settings page routing from web**: Delete `/settings/*` routes from `apps/web/src/router.tsx` and the route wrapper components in `apps/web/src/pages/settings/index.tsx`. The main `/settings` route stays but triggers the panel stack instead.
- **Remove settings page routing from extension**: Remove all settings-related `PageView` cases from `HomePage.tsx` switch statement. Settings navigation is fully handled inside the panel stack.
- **Remove settings screen routes from mobile**: Delete the `apps/mobile/app/(app)/(tabs)/settings/` route directory (20 screen files). Settings navigation moves inside the panel stack component.
- **Rename `SettingsPageLayout` to `SettingsPanelContent`** in `packages/ui`: Since these are no longer "pages" but panel content, rename for clarity. The component stays functionally identical (header + scrollable content).
- **Update `SettingsSheet` props**: Remove `onNavigate` from `SettingsSheetBaseProps` — navigation is now internal to the panel stack. Add panel stack management props instead.

## Capabilities

### New Capabilities
- `settings-panel-stack`: Generic stacking panel system that manages a stack of panels with slide-in/out animations, back navigation, and gesture support (mobile). Shared logic in `packages/shared`, UI implementations in `packages/ui` (DOM) and `apps/mobile` (React Native).

### Modified Capabilities
- `security-settings`: Navigation flow changes from page-based to panel-based. Requirements stay the same, just the container changes.

## Impact

- **packages/shared**: Update `SettingsSheetBaseProps` — remove `onNavigate`, add panel stack types. Update `SettingsScreen` type if needed.
- **packages/ui**: New `SettingsPanelStack` component. Refactor `SettingsSheet` to use it. Rename `SettingsPageLayout` → `SettingsPanelContent`. Remove `PageShell` usage from settings contexts (PageShell still used by non-settings pages like TokenDetail, NftDetail).
- **apps/extension**: Simplify `HomePage.tsx` — remove all settings page cases from the switch statement. SettingsSheet + PanelStack handles everything.
- **apps/web**: Remove settings sub-routes from router. Remove/refactor route wrappers in `pages/settings/index.tsx`. Settings panel stack opens from a trigger on the settings page or header.
- **apps/mobile**: Delete `app/(app)/(tabs)/settings/` route files. New `SettingsPanelStack` native component replaces stack navigation. Update `_layout.tsx` to use panel stack instead of `router.push`.
- **Dead code removal**: ~20 mobile route files, ~18 web route wrappers, ~16 extension page switch cases all get deleted or consolidated.
