## ADDED Requirements

### Requirement: Mobile settings provide a dedicated currency selector panel
The mobile app SHALL provide a dedicated `CurrencySelector` settings panel in `apps/mobile` for the `currency` settings screen. The panel SHALL be reachable from the existing settings sheet / settings panel stack flow and SHALL render the supported display currencies as selectable rows.

**Package:** `apps/mobile`

#### Scenario: User opens display currency settings
- **WHEN** the user opens Settings and selects the `currency` option from the mobile settings sheet
- **THEN** the system SHALL push a dedicated currency selector panel inside the existing settings panel stack
- **THEN** the panel SHALL display a title for display currency settings

#### Scenario: Selector shows supported currencies with current selection
- **WHEN** the currency selector panel is rendered
- **THEN** the system SHALL render one row for each supported display currency
- **THEN** each row SHALL display the currency name and symbol
- **THEN** the currently active display currency SHALL be visually marked as selected

#### Scenario: Selecting a new currency applies the choice and returns to settings
- **WHEN** the user selects a currency different from the current one
- **THEN** the system SHALL update the active display currency
- **THEN** the selector panel SHALL return to the previous settings panel after the change is applied

### Requirement: Mobile currency selection uses the shared currency domain
The mobile currency selector SHALL use the shared currency domain from `packages/shared` as its source of truth for supported currencies, active currency state, and persistence behavior.

**Package:** `packages/shared`, `apps/mobile`

#### Scenario: Supported currency list matches shared definitions
- **WHEN** the selector panel is built
- **THEN** the list of currencies SHALL come from the shared supported currency definitions
- **THEN** the labels and symbols shown in mobile SHALL match the shared currency metadata

#### Scenario: Active state reflects shared currency context
- **WHEN** the current display currency in the shared currency context is `eur`
- **THEN** the mobile selector SHALL mark `eur` as selected when the panel opens

#### Scenario: Currency choice persists through shared context
- **WHEN** the user selects a new display currency and later reopens the selector
- **THEN** the previously chosen currency SHALL remain selected
- **THEN** the selection SHALL reflect the persisted value managed by the shared currency context
