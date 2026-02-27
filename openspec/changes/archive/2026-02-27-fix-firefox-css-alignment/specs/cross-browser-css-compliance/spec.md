## ADDED Requirements

### Requirement: Flex containers MUST declare display flex

All extension styled components that use `alignItems`, `justifyContent`, or `gap` SHALL declare `display: 'flex'` explicitly. Components SHALL NOT rely on browser-specific implicit flex behavior.

#### Scenario: TokenListItem ValueContainer aligns prices to the right
- **WHEN** the token list renders in any browser (Chrome, Firefox, Edge)
- **THEN** the dollar amount and token balance in `ValueContainer` SHALL be right-aligned via `alignItems: 'flex-end'` with explicit `display: 'flex'` and `flexDirection: 'column'`

#### Scenario: TokenListItem BitcoinAmountContainer aligns prices to the right
- **WHEN** a Bitcoin token item renders in any browser
- **THEN** the BTC amounts in `BitcoinAmountContainer` SHALL be right-aligned via `alignItems: 'flex-end'` with explicit `display: 'flex'` and `flexDirection: 'column'`

#### Scenario: TokenList SkeletonValueContainer aligns skeleton loaders to the right
- **WHEN** the token list skeleton loading state renders in any browser
- **THEN** the skeleton placeholders in `SkeletonValueContainer` SHALL be right-aligned via `alignItems: 'flex-end'` with explicit `display: 'flex'` and `flexDirection: 'column'`

### Requirement: Button-based styled components MUST declare text alignment

All extension styled components wrapping `<button>` elements SHALL declare `textAlign: 'center'` explicitly. Components SHALL NOT rely on browser-specific user-agent defaults for button text alignment.

#### Scenario: HomePage TabButton centers tab labels
- **WHEN** the Home/Collectibles/Swap tabs render in any browser
- **THEN** each tab label text SHALL be horizontally centered within its tab area

#### Scenario: LockPage ForgotPasswordButton centers link text
- **WHEN** the lock screen renders in any browser
- **THEN** the "I forgot my password" text SHALL be horizontally centered
