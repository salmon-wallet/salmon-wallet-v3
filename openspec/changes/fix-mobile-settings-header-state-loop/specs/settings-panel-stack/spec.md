## MODIFIED Requirements

### Requirement: Mobile settings panel stack coordinates panel navigation without destabilizing the shell header
The mobile settings panel stack SHALL provide push/pop navigation for subscreens without forcing the shell header to depend on render-time callback identities from the active panel content.

**Package:** `apps/mobile`

#### Scenario: Panel stack pushes a standard subscreen
- **WHEN** the stack pushes a standard settings screen
- **THEN** the shell header SHALL remain derivable from stable screen metadata and stack depth
- **THEN** the panel content MAY receive `onBack` and `onNavigate` props for interaction
- **THEN** those props SHALL NOT be the required source of truth for the shell header state
