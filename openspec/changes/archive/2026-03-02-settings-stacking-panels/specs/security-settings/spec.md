## MODIFIED Requirements

### Requirement: Security settings page
The system SHALL provide a `SecurityPage` in settings that groups security-related options: change password and biometric authentication toggle. The page SHALL be accessible from the settings panel stack in both platforms (rendered as a stacked panel instead of a standalone page/route).

**Package:** `apps/mobile`, `apps/extension`, `packages/shared` (types)

#### Scenario: User opens security settings
- **WHEN** user taps "Security" in the settings menu panel
- **THEN** the system pushes a new panel in the stack displaying security options: "Change Password" and "Biometric Unlock" (mobile only if device supports it)
- **THEN** the panel SHALL slide in from the right over the settings menu
