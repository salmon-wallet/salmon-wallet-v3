## ADDED Requirements

### Requirement: GateContainer SHALL be a single animated surface with four states
The `GateContainer` component SHALL manage one `translateY` shared value and render different content based on its `state` prop: `locked`, `collapsed`, `settings`, or `wallets`.

#### Scenario: Locked state — gate covers full screen instantly
- **WHEN** `state` is `locked`
- **THEN** `translateY` SHALL be `0` immediately (no animation)
- **THEN** the gate SHALL cover the entire screen
- **THEN** the backdrop SHALL NOT be visible
- **THEN** `LockContent` SHALL be rendered as the gate's content

#### Scenario: Collapsed state — gate is at header position
- **WHEN** `state` transitions from `locked` to `collapsed`
- **THEN** `translateY` SHALL animate from `0` to `-(screenHeight - headerHeight)` over 600ms with cubic easing
- **THEN** after animation completes, `HeaderContent` SHALL fade in over 200ms
- **THEN** the backdrop SHALL NOT be visible

#### Scenario: Expanded settings — gate slides down
- **WHEN** `state` transitions from `collapsed` to `settings`
- **THEN** `translateY` SHALL animate from `-(screenHeight - headerHeight)` toward `0` (or partial based on settings height) over 300ms
- **THEN** the backdrop SHALL fade in
- **THEN** `SettingsSheet` content SHALL be rendered

#### Scenario: Expanded wallets — gate slides down
- **WHEN** `state` transitions from `collapsed` to `wallets`
- **THEN** the same animation as settings SHALL apply
- **THEN** `WalletSwitcherSheet` content SHALL be rendered

#### Scenario: Close expanded — gate slides up to collapsed
- **WHEN** `state` transitions from `settings` or `wallets` to `collapsed`
- **THEN** `translateY` SHALL animate back to `-(screenHeight - headerHeight)` over 300ms
- **THEN** the backdrop SHALL fade out
- **THEN** `HeaderContent` SHALL be visible

#### Scenario: Lock from any state — instant full screen
- **WHEN** `state` transitions to `locked` from any other state
- **THEN** `translateY` SHALL be set to `0` immediately (no animation)
- **THEN** the backdrop SHALL hide immediately

### Requirement: GateContainer SHALL separate animation from content
The `GateContainer` SHALL NOT contain business logic (biometric, password, settings panels). It SHALL receive content as children or render props and only manage the animated surface (background, scales, translateY, backdrop).

#### Scenario: Content components are independent
- **WHEN** GateContainer renders content for any state
- **THEN** the content component SHALL receive its own props and manage its own logic
- **THEN** GateContainer SHALL only provide the animated wrapper and visual surface

### Requirement: GateContainer SHALL share visual surface across all states
All states SHALL use the same background color (`colors.background.primary`) and `ScalesBackground` pattern, creating visual continuity as the gate transitions between states.

#### Scenario: Visual continuity between lock and settings
- **WHEN** the gate transitions from `locked` to `collapsed` to `settings`
- **THEN** the background color and scales pattern SHALL remain consistent
- **THEN** the user SHALL perceive a single surface moving, not separate components appearing/disappearing
