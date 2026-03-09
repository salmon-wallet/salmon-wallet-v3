## MODIFIED Requirements

### Requirement: Mobile settings panel stack uses rightward lateral navigation semantics
The mobile settings panel stack SHALL animate sub-screens as a horizontal panel flow where new panels enter from the right and dismissed panels exit to the right when navigating back.

**Package:** `apps/mobile`

#### Scenario: User opens a settings sub-screen
- **WHEN** the user taps a settings item that pushes a sub-screen
- **THEN** the new panel SHALL enter from the right edge
- **THEN** the previous panel SHALL remain underneath during the transition

#### Scenario: User returns from a settings sub-screen
- **WHEN** the user presses back or triggers a pop from a settings sub-screen
- **THEN** the current panel SHALL animate out toward the right edge
- **THEN** the previous panel SHALL be revealed underneath

#### Scenario: Swipe-back preserves the same exit direction
- **WHEN** the user triggers the back interaction via the horizontal swipe gesture
- **THEN** the visible panel SHALL still exit toward the right
- **THEN** the animation semantics SHALL match the non-gesture back action
