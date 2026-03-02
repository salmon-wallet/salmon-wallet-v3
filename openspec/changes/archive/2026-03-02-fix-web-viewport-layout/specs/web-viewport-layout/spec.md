## ADDED Requirements

### Requirement: Web screens MUST be viewport-locked
All web app page containers (`apps/web`) SHALL use `height: '100vh'` and `overflow: 'hidden'` on their root Container styled component. Pages MUST NOT use `minHeight: '100vh'` on root containers (except SettingsPage which intentionally allows page-level scroll via PageShell `fullHeight={false}`).

#### Scenario: Welcome screen fills viewport exactly
- **WHEN** user navigates to `/auth/select` (SelectPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Create page fills viewport exactly
- **WHEN** user navigates to `/auth/create` (CreatePage) on any step (message, seedPhrase, validate)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Recover page fills viewport exactly
- **WHEN** user navigates to `/auth/recover` (RecoverPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Password page fills viewport exactly
- **WHEN** user navigates to `/auth/password` (PasswordPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Success page fills viewport exactly
- **WHEN** user navigates to `/auth/success` (SuccessPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Derived accounts page fills viewport exactly
- **WHEN** user navigates to `/auth/derived` (DerivedAccountsPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Lock page fills viewport exactly
- **WHEN** user navigates to `/lock` (LockPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: Home page fills viewport exactly
- **WHEN** user navigates to `/home` (HomePage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

#### Scenario: dApp approval pages fill viewport exactly
- **WHEN** user navigates to any dApp approval page (ConnectApprovalPage, SignMessageApprovalPage, SignTransactionApprovalPage)
- **THEN** the page occupies exactly the browser viewport height with no document-level scrollbar

### Requirement: WalletLayout MUST enforce viewport lock
The `WalletLayout` component in `packages/ui/src/layouts/WalletLayout.tsx` SHALL use `height: '100vh'` and `overflow: 'hidden'` on its Outer container, and `height: '100%'` on its Inner container.

#### Scenario: WalletLayout constrains all child routes
- **WHEN** any route renders inside WalletLayout
- **THEN** the WalletLayout outer container has exactly `height: 100vh` and `overflow: hidden`, and the inner container has `height: 100%`

### Requirement: Internal scroll MUST be preserved where needed
Pages with variable-height content sections SHALL use `overflowY: 'auto'` and `minHeight: 0` on the flex child that contains scrollable content, so users can scroll within that section while the page itself remains viewport-locked.

#### Scenario: Token list scrolls internally on HomePage
- **WHEN** the token list in HomePage has more items than can fit in the visible area
- **THEN** the TokenSection scrolls internally while the page container does not scroll

#### Scenario: Derived accounts list scrolls internally
- **WHEN** DerivedAccountsPage has more accounts than can fit in the visible area
- **THEN** the ListContainer scrolls internally while the page container does not scroll

#### Scenario: Seed grid content scrolls internally on CreatePage
- **WHEN** the seed phrase grid or validation inputs exceed the available space in CreatePage
- **THEN** the CenterContent area scrolls internally while the page container does not scroll
