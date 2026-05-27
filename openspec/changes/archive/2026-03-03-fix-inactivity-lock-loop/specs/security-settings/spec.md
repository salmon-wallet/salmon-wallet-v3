## MODIFIED Requirements

### Requirement: Security settings page
The system SHALL provide a `SecurityPage` in settings that groups security-related options: change password and biometric authentication toggle. The page SHALL be accessible from the main settings menu in both platforms. The auto-lock feature SHALL fully invalidate the session when triggered by inactivity, clearing cached session keys so that re-authentication requires explicit user action (password or biometric).

**Package:** `apps/mobile`, `apps/extension`, `apps/web`, `packages/shared` (types)

#### Scenario: User opens security settings
- **WHEN** user navigates to Settings > Security
- **THEN** the system displays security options: "Change Password" and "Biometric Unlock" (mobile only if device supports it)

#### Scenario: Inactivity auto-lock invalidates session fully
- **WHEN** the inactivity timeout triggers an auto-lock on web or extension
- **THEN** the system SHALL clear the session key cache before locking
- **THEN** the user SHALL be required to enter their password to unlock
- **THEN** the system SHALL NOT enter a lock-unlock loop
