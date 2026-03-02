## ADDED Requirements

### Requirement: Section cards use BlurContainer on web
Transaction detail section cards (Date & Time, tokens, addresses, transaction hash) must use `BlurContainer` instead of plain styled Box containers on web/extension.

#### Scenario: Section card rendering
- **WHEN** the transaction detail modal renders on web/extension
- **THEN** each section card is wrapped in a `BlurContainer` with appropriate border radius and padding

### Requirement: Transaction hash uses project font
The transaction hash text must use the project's standard font family, not monospace.

#### Scenario: Hash display on web
- **WHEN** a transaction hash is displayed in the detail modal on web
- **THEN** it renders with `fontFamily.sans`, not `fontFamily.mono`

### Requirement: Explorer button uses amber color
The "View on Explorer" button must use `colors.palette.amber` instead of `colors.accent.primary` on all platforms.

#### Scenario: Explorer button on web
- **WHEN** the explorer button renders on web/extension
- **THEN** background, border, text, and icons use `colors.palette.amber`

#### Scenario: Explorer button on mobile
- **WHEN** the explorer button renders on mobile
- **THEN** background, border, text, and icons use `colors.palette.amber`
