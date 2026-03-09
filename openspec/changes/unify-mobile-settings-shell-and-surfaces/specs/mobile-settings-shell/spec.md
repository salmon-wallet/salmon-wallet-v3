## ADDED Requirements

### Requirement: Mobile settings uses a single active shell header
The mobile settings experience SHALL display a single active header at the top of the settings overlay. That header SHALL reflect the currently visible subscreen instead of always showing the root settings title.

**Package:** `apps/mobile`

#### Scenario: User is on the root settings menu
- **WHEN** the settings overlay opens on the root menu
- **THEN** the top header SHALL show `Settings`
- **THEN** the top header SHALL show a close button
- **THEN** it SHALL NOT show a back button

#### Scenario: User opens a settings subscreen
- **WHEN** the user opens a subscreen such as Accounts, Language, or About
- **THEN** the top header SHALL show the active subscreen title
- **THEN** the top header SHALL show a back button on the left
- **THEN** the close button SHALL remain visible on the right

#### Scenario: Subscreen with internal step navigation updates the shell back action
- **WHEN** a settings subscreen manages its own internal steps
- **THEN** the top header back action SHALL invoke the active subscreen's contextual back behavior instead of blindly popping the panel stack

### Requirement: Mobile settings subscreens do not render a duplicated internal header by default
The shared mobile settings screen layout SHALL render content without a duplicated internal header unless a specific screen explicitly opts in.

**Package:** `apps/mobile`

#### Scenario: User opens a standard settings subscreen
- **WHEN** a panel such as Accounts or Currency renders through `SettingsScreenLayout`
- **THEN** it SHALL rely on the shell header for back + title
- **THEN** it SHALL NOT render a second visible header row inside the panel content by default
