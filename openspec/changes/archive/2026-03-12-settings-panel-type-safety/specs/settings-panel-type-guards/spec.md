## ADDED Requirements

### Requirement: Type-safe SettingsItem IDs

The local `SettingsItem` interface in `SettingsPanelStack.tsx` SHALL use a union type for its `id` field instead of `string`. The union SHALL include all `SettingsScreen` values plus any non-panel action IDs used in `SETTINGS_SECTIONS` (e.g., `'developerNetworks'`).

#### Scenario: Compile-time validation of SETTINGS_SECTIONS
- **WHEN** a developer adds an item to `SETTINGS_SECTIONS` with an `id` not in the union type
- **THEN** TypeScript SHALL report a type error at the definition site

#### Scenario: Cast removal in handleItemClick
- **WHEN** `handleItemClick` processes a navigation item
- **THEN** the code SHALL NOT use `as SettingsScreen` cast; instead it SHALL use type narrowing to determine the item is a valid `SettingsScreen`

### Requirement: Runtime warning for missing panel renderers

When rendering a panel from the `panelRegistry`, if `panelRegistry[entry.screen]` is `undefined`, the system SHALL log a `console.warn` with the missing screen name and return `null` for that panel.

#### Scenario: Missing panel in registry
- **WHEN** `panelRegistry[entry.screen]` returns `undefined`
- **THEN** the system SHALL call `console.warn` with a message identifying the missing screen and SHALL render nothing for that entry
