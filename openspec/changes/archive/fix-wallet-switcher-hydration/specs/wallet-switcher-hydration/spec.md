## ADDED Requirements

### Requirement: WalletSwitcherSheet produces valid HTML nesting
The `WalletSwitcherSheet` component in `packages/ui` SHALL render valid HTML where no `<p>` element is a descendant of another `<p>` element. Specifically, styled components used as `primary` and `secondary` props of MUI `ListItemText` SHALL render as inline elements (`<span>`) to avoid invalid nesting with MUI's wrapper `<Typography>` elements.

#### Scenario: Account name renders without nested block elements
- **WHEN** the `WalletSwitcherSheet` renders an account list item
- **THEN** the `AccountName` styled component SHALL render as a `<span>` element
- **AND** the resulting DOM SHALL NOT contain a `<p>` nested inside another `<p>`

#### Scenario: Account address renders without nested block elements
- **WHEN** the `WalletSwitcherSheet` renders an account list item
- **THEN** the `AccountAddress` styled component SHALL render as a `<span>` element
- **AND** the resulting DOM SHALL NOT contain a `<p>` nested inside another `<p>`

#### Scenario: No hydration error in web app
- **WHEN** the `WalletSwitcherSheet` is rendered on the web app with SSR or strict mode
- **THEN** no hydration mismatch error SHALL appear in the browser console
- **AND** the visual appearance of account name and address SHALL remain identical to the current design
