## MODIFIED Requirements

### Requirement: Mobile settings screens use compact top spacing aligned with settings panels
All mobile settings sub-screens that use `SettingsScreenLayout` SHALL render with a compact internal header whose top spacing matches the density of the settings panels used in web/extension.

**Package:** `apps/mobile`

#### Scenario: User opens a settings sub-screen
- **WHEN** the user opens a mobile settings sub-screen such as Accounts, Currency, Language, or About
- **THEN** the back affordance and the screen title SHALL render as a compact header block near the top of the sub-screen
- **THEN** the sub-screen SHALL NOT insert an extra standalone top row that pushes the title noticeably lower than in web/extension settings panels

#### Scenario: Content starts directly below the compact header
- **WHEN** a settings sub-screen contains a list or form
- **THEN** the scrollable content SHALL begin immediately below the compact header using shared spacing tokens
- **THEN** the top content spacing SHALL be visually aligned with the `SettingsPanelContent` pattern used in `packages/ui`

### Requirement: Shared settings layout change applies across mobile settings screens
The mobile app SHALL centralize the top-spacing adjustment in `SettingsScreenLayout` so that all settings screens using that layout inherit the same header density and spacing behavior.

**Package:** `apps/mobile`

#### Scenario: Multiple screens inherit the same spacing
- **WHEN** `CurrencySelector`, `AccountsPanel`, and `AboutPanel` render through `SettingsScreenLayout`
- **THEN** they SHALL all display the same compact top header spacing without per-screen spacing overrides

### Requirement: Settings layout supports list-backed screens without nested virtualized lists
The mobile settings layout SHALL support screens that render their own list-backed content without requiring a `FlatList` or other virtualized list to be nested inside the shared `ScrollView`.

**Package:** `apps/mobile`

#### Scenario: List-backed screen opts out of shared scroll wrapper
- **WHEN** a settings screen such as `AvatarPicker` or `AccountsPanel` needs to render list-backed content
- **THEN** it SHALL be able to render through `SettingsScreenLayout` without nesting its `FlatList` inside the layout's shared `ScrollView`
- **THEN** the screen SHALL preserve the same compact top header spacing as other settings screens
