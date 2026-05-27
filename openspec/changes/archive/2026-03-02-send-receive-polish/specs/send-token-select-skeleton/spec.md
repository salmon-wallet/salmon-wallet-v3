## ADDED Requirements

### Requirement: StepTokenSelectProps includes loading flag
The `StepTokenSelectProps` interface in `packages/shared/src/types/ui/send-sheet.ts` SHALL include an optional `loading?: boolean` property that signals whether token data is still being fetched.

#### Scenario: Loading prop defaults to falsy
- **WHEN** a consumer renders StepTokenSelect without passing `loading`
- **THEN** the component SHALL treat loading as false and render the token list normally

### Requirement: StepTokenSelect shows skeleton when loading on web/extension
The `StepTokenSelect` component in `packages/ui/src/components/SendPage/StepTokenSelect.tsx` SHALL render a skeleton placeholder when `loading` is true, using MUI `<Skeleton>` components and `colors.skeleton.base`/`colors.skeleton.highlight` tokens.

#### Scenario: Tokens are loading on web/extension
- **WHEN** `loading` is true
- **THEN** StepTokenSelect SHALL display a skeleton layout consisting of a search bar placeholder and 5 token row placeholders (each with a circular logo skeleton and two text bar skeletons), all wrapped in `BlurContainer`

#### Scenario: Tokens finish loading on web/extension
- **WHEN** `loading` transitions from true to false and `tokens` array is populated
- **THEN** StepTokenSelect SHALL replace the skeleton with the actual search bar and token list

#### Scenario: Empty token list is not confused with loading
- **WHEN** `loading` is false and `tokens` is an empty array
- **THEN** StepTokenSelect SHALL display the "No tokens found" empty state, NOT the skeleton

### Requirement: StepTokenSelect shows skeleton when loading on mobile
The `StepTokenSelect` component in `apps/mobile/src/components/SendSheet/StepTokenSelect.tsx` SHALL render a skeleton placeholder when `loading` is true, using `ContentLoader`/`Rect`/`Circle` from `@salmon/shared` and `colors.skeleton.base`/`colors.skeleton.highlight` tokens.

#### Scenario: Tokens are loading on mobile
- **WHEN** `loading` is true
- **THEN** StepTokenSelect SHALL display a skeleton layout consisting of a search bar placeholder and 5 token row placeholders (each with a circular logo skeleton and two text bar skeletons), all wrapped in `BlurContainer`

#### Scenario: Tokens finish loading on mobile
- **WHEN** `loading` transitions from true to false and `tokens` array is populated
- **THEN** StepTokenSelect SHALL replace the skeleton with the actual search bar and token list

### Requirement: Bitcoin send flow skips skeleton
The Send flow for Bitcoin skips the token-select step entirely (goes directly to address-amount). The skeleton SHALL NOT be shown for Bitcoin.

#### Scenario: Bitcoin send opened
- **WHEN** user opens Send with `blockchain === 'bitcoin'`
- **THEN** the send flow SHALL skip token-select and render address-amount directly, with no skeleton displayed
