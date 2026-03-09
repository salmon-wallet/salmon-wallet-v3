## MODIFIED Requirements

### Requirement: All custom styled props use the $ prefix
Extends the existing requirement to cover styled components that use `shouldForwardProp` as an alternative. After this change, NO styled component in `packages/ui/src/` SHALL use `shouldForwardProp` — all transient props SHALL use the `$` prefix instead.

#### Scenario: shouldForwardProp replaced with $ prefix
- **WHEN** a styled component uses `shouldForwardProp` to filter custom props
- **THEN** the `shouldForwardProp` option SHALL be removed and the prop SHALL be renamed with `$` prefix

#### Scenario: Zero shouldForwardProp usage in packages/ui
- **WHEN** searching `packages/ui/src/` for `shouldForwardProp`
- **THEN** zero results SHALL be found
