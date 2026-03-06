## MODIFIED Requirements

### Requirement: Mobile settings panel stack uses a single shared stack per overlay session
The mobile settings overlay SHALL use a single `useSettingsPanelStack()` session per opening of `SettingsSheet`. The settings menu and the rendered subpages SHALL operate on the same stack state.

**Package:** `apps/mobile`, `packages/shared`

#### Scenario: User opens a settings option
- **WHEN** the settings overlay is visible and the user taps a navigation option such as `language` or `currency`
- **THEN** the system SHALL push the target screen onto the same stack instance that drives the rendered settings panel stack
- **THEN** the corresponding settings subpage SHALL become visible inside the overlay

#### Scenario: Closing the overlay resets the session
- **WHEN** the user closes the settings overlay while one or more subpages are open
- **THEN** the system SHALL reset the settings panel stack
- **THEN** reopening settings SHALL show the base settings menu instead of the previously open subpage

### Requirement: Mobile settings behaves as a full-screen top overlay with internal page navigation
The mobile settings experience SHALL render inside the existing top-entry modal container and SHALL appear as a full-screen overlay. Subpages SHALL be navigated internally within that overlay instead of opening external routes or nested modal containers.

**Package:** `apps/mobile`

#### Scenario: Settings opens as a full-screen overlay
- **WHEN** the user opens settings in mobile
- **THEN** the top-entry settings container SHALL occupy the full available height
- **THEN** the settings menu SHALL appear as the root page within that overlay

#### Scenario: User navigates inside settings
- **WHEN** the user opens a settings subpage and then presses back inside that subpage
- **THEN** the system SHALL pop only the top settings subpage
- **THEN** the user SHALL remain inside the same settings overlay session

#### Scenario: Closing settings exits the whole flow
- **WHEN** the user closes the settings overlay from the root page or from a nested subpage
- **THEN** the full settings overlay SHALL close
- **THEN** all nested settings pages SHALL be dismissed together
