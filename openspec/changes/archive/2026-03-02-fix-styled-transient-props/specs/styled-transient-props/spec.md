## ADDED Requirements

### Requirement: All custom styled props use the $ prefix
All custom props in Emotion `styled()` component generics in `packages/ui/src/` SHALL use the `$` prefix to prevent DOM forwarding. Props that are valid on the base component's API (e.g., `disabled` on `Button`) are exempt.

#### Scenario: Custom boolean prop on styled component
- **WHEN** a styled component defines a custom prop like `isDanger` for styling logic
- **THEN** the prop SHALL be named `$isDanger` in the generic type, destructuring, and JSX usage

#### Scenario: Custom string prop on styled component
- **WHEN** a styled component defines a custom string prop like `bgColor` or `borderColor`
- **THEN** the prop SHALL be named `$bgColor` or `$borderColor` respectively

#### Scenario: No console errors from styled props
- **WHEN** any `@salmon/ui` component renders in a browser (web or extension)
- **THEN** the console SHALL have zero "React does not recognize the prop" errors originating from `packages/ui`

### Requirement: Valid native/MUI props remain unprefixed
Props that are part of the base MUI component's API SHALL NOT be prefixed with `$`.

#### Scenario: disabled on Button
- **WHEN** `styled(Button)<{ disabled?: boolean }>` is used and `disabled` is a valid Button prop
- **THEN** `disabled` SHALL remain unprefixed
