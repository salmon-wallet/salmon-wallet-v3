## Context

`SettingsPanelStack.tsx` has a local `SettingsItem` interface where `id` is typed as `string`. When handling clicks, `item.id` is cast with `as SettingsScreen` (line 333). This is fragile — a misconfigured item ID would silently fail. Additionally, when rendering panels, if `panelRegistry[entry.screen]` is undefined, nothing renders with no warning.

## Goals / Non-Goals

**Goals:**
- Make `SettingsItem.id` type-safe by using `SettingsScreen` union + the non-panel action IDs
- Remove the `as SettingsScreen` cast with proper type narrowing
- Add `console.warn` when a panel renderer is missing from the registry

**Non-Goals:**
- Changing `PanelRegistry` to be non-Partial (would require all panels registered everywhere)
- Adding runtime validation beyond a console.warn
- Modifying the SettingsSheet component (extension-specific, separate concern)

## Decisions

### 1. Use discriminated union for SettingsItem.id

**Decision**: Change `SettingsItem.id` from `string` to a union type. The `SETTINGS_SECTIONS` items use IDs that are either `SettingsScreen` values (for navigation) or special action IDs (`developerNetworks` for toggle). Since `developerNetworks` is not in `SettingsScreen`, the union is `SettingsScreen | 'developerNetworks'`.

**Rationale**: This catches typos at compile time. The `as SettingsScreen` cast becomes unnecessary because for `type: 'navigation'` items, the ID is already narrowed.

### 2. Add console.warn, not throw

**Decision**: When `panelRegistry[entry.screen]` is undefined, log `console.warn(\`No panel registered for: ${entry.screen}\`)` and return null.

**Rationale**: This is a development aid, not a runtime safety net. In production, missing panels are intentional (e.g., some platforms register fewer panels).

## Risks / Trade-offs

- **[Risk] Some IDs in SETTINGS_SECTIONS might not match SettingsScreen exactly** → Mitigation: TypeScript will flag any mismatch immediately after the type change.
