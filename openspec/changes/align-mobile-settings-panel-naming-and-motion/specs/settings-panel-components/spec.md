## ADDED Requirements

### Requirement: Mobile settings panel components use names aligned with shared UI panels
When a mobile settings sub-screen represents the same conceptual panel as a component already defined in `packages/ui/src/components`, the mobile component SHALL use the same component and directory naming convention.

**Package:** `apps/mobile`

#### Scenario: Mobile avatar screen uses the shared panel name
- **WHEN** the mobile settings registry renders the avatar screen
- **THEN** it SHALL render a component named `AccountAvatarPanel`
- **THEN** the corresponding mobile component directory/export SHALL use the same name

#### Scenario: Mobile private key screen uses the shared panel name
- **WHEN** the mobile settings registry renders the private key screen
- **THEN** it SHALL render a component named `PrivateKeyPanel`

#### Scenario: Mobile address book flow uses the shared panel names
- **WHEN** the mobile settings registry renders the address book list, add, or edit screens
- **THEN** it SHALL use components named `AddressBookPanel`, `AddressAddPanel`, and `AddressEditPanel`

### Requirement: Mobile settings screen IDs remain stable while component names are aligned
The mobile settings rename SHALL preserve the existing `SettingsScreen` IDs and registry keys unless a direct technical blocker requires otherwise.

**Package:** `apps/mobile`, `packages/shared`

#### Scenario: Existing settings navigation still resolves after rename
- **WHEN** the user opens settings screens such as `avatar`, `privateKey`, or `addressBook`
- **THEN** the same screen IDs SHALL continue to resolve through the mobile `panelRegistry`
- **THEN** only the component/module naming behind those screens SHALL change
