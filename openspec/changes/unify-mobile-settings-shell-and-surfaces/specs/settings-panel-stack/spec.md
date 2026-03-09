## MODIFIED Requirements

### Requirement: Mobile settings panels share the same visual shell background as the settings root
The mobile settings panel stack SHALL present subscreens using the same base visual shell as the root settings screen, rather than a separate flat secondary panel background.

**Package:** `apps/mobile`

#### Scenario: User opens a settings subscreen
- **WHEN** a settings panel is pushed on top of the root menu
- **THEN** the visible panel background SHALL match the base settings shell aesthetic
- **THEN** the subscreen SHALL not appear as a visually separate gray layer disconnected from the root settings screen
