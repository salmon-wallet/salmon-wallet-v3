## MODIFIED Requirements

### Requirement: Mobile settings uses a single active shell header
The mobile settings experience SHALL display a single active header at the top of the settings overlay. That header SHALL be derived from a stable navigation-owned source for standard subscreens and SHALL NOT depend on child layout effects for ordinary panel navigation.

**Package:** `apps/mobile`

#### Scenario: User opens a standard settings subscreen
- **WHEN** the user opens a standard subscreen such as Accounts, Language, Currency, or About
- **THEN** the top header SHALL show the active subscreen title
- **THEN** the top header back action SHALL resolve from the settings panel stack navigation state
- **THEN** opening the subscreen SHALL NOT trigger a render loop or runtime error

#### Scenario: User opens a dynamic multi-step subscreen
- **WHEN** a subscreen manages an internal step flow that changes the visible title or back action without pushing a new settings screen
- **THEN** that subscreen MAY provide an explicit header override API
- **THEN** the override mechanism SHALL NOT require the shared layout component to push parent state on every render

### Requirement: Mobile settings subscreens do not render a duplicated internal header by default
The shared mobile settings screen layout SHALL render content without a duplicated internal header unless a specific screen explicitly opts in, and it SHALL NOT synchronize shell header state as an implicit side effect for standard screens.

**Package:** `apps/mobile`

#### Scenario: Standard screen renders through `SettingsScreenLayout`
- **WHEN** a standard settings panel such as Accounts renders through `SettingsScreenLayout`
- **THEN** it SHALL rely on the shell header for back + title
- **THEN** it SHALL NOT mutate shell header state from a generic layout effect
