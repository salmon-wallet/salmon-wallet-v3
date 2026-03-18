## ADDED Requirements

### Requirement: Mobile AppState lock trigger
The AppState listener in `apps/mobile/app/_layout.tsx` SHALL only trigger `lockAccounts()` when the app transitions from `active` to `background`. Transitions to `inactive` (caused by system overlays such as Face ID prompts, Control Center, notifications) SHALL NOT trigger a lock.

#### Scenario: App goes to background
- **WHEN** AppState changes from `active` to `background`
- **THEN** `lockAccounts()` SHALL be called

#### Scenario: Face ID system overlay appears
- **WHEN** AppState changes from `active` to `inactive` due to a Face ID prompt
- **THEN** `lockAccounts()` SHALL NOT be called
- **THEN** the app SHALL remain unlocked when returning to `active`

#### Scenario: Control Center or notification appears
- **WHEN** AppState changes from `active` to `inactive` due to a system overlay
- **THEN** `lockAccounts()` SHALL NOT be called
