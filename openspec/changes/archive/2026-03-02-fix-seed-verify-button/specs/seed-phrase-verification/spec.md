## ADDED Requirements

### Requirement: Position generation returns 1-indexed values
`generateValidationPositions()` in `packages/shared/src/crypto/mnemonic.ts` SHALL return an array of 1-indexed positions. Each position represents the human-readable word number (e.g., position 4 = the 4th word).

#### Scenario: Generating positions for a 12-word mnemonic
- **WHEN** `generateValidationPositions(12, 3)` is called
- **THEN** it returns exactly 3 positions, each between 1 and 12 inclusive, one from each third of the mnemonic

### Requirement: All platforms display word position correctly
Each platform (mobile, extension, web) SHALL pass the 1-indexed position directly to `SeedWordInput`'s `position` prop, without adding or subtracting from it.

#### Scenario: Displaying word labels on web
- **WHEN** a position value of `4` is received from `generateValidationPositions()`
- **THEN** `SeedWordInput` receives `position={4}` and renders "Word #4"

#### Scenario: Displaying word labels on mobile
- **WHEN** a position value of `4` is received from `generateValidationPositions()`
- **THEN** `SeedWordInput` receives `position={4}` and renders "Word #4"

#### Scenario: Displaying word labels on extension
- **WHEN** a position value of `4` is received from `generateValidationPositions()`
- **THEN** `SeedWordInput` receives `position={4}` and renders "Word #4"

### Requirement: Inline validation uses correct array indexing
Each platform SHALL convert 1-indexed positions to 0-indexed when accessing the `words` array (i.e., `words[pos - 1]`).

#### Scenario: Inline validation matches correct word on web
- **WHEN** the user types a word for position `4`
- **THEN** the inline validation compares against `words[3]` (the 4th word, 0-indexed)

#### Scenario: Inline validation matches correct word on mobile and extension
- **WHEN** the user types a word for position `4`
- **THEN** the inline validation compares against `words[3]` (the 4th word, 0-indexed)

### Requirement: Button validation is consistent with inline validation
The button's `disabled` state SHALL be driven by `validateMnemonicWords()`, which receives the same 1-indexed positions used by the inline validation. The button MUST enable when all three inline validations show "correct".

#### Scenario: All words correct enables the button
- **WHEN** the user enters the correct word for all 3 positions
- **THEN** all three inputs show green borders (correct state) AND the CONTINUE/NEXT button becomes enabled

#### Scenario: Any word incorrect keeps button disabled
- **WHEN** the user has entered an incorrect word for at least one position
- **THEN** the CONTINUE/NEXT button remains disabled

### Requirement: validateMnemonicWords uses 1-indexed positions
`validateMnemonicWords()` in `packages/shared/src/crypto/mnemonic.ts` SHALL accept 1-indexed positions and internally convert to 0-indexed array access via `words[pos - 1]`.

#### Scenario: Validating correct words
- **WHEN** called with mnemonic `"apple banana cherry date"`, positions `[1, 3]`, and userWords `["apple", "cherry"]`
- **THEN** it returns `{ isValid: true, results: [{ position: 1, isCorrect: true }, { position: 3, isCorrect: true }] }`

#### Scenario: Validating incorrect words
- **WHEN** called with mnemonic `"apple banana cherry date"`, positions `[1, 3]`, and userWords `["apple", "wrong"]`
- **THEN** it returns `{ isValid: false, results: [{ position: 1, isCorrect: true }, { position: 3, isCorrect: false }] }`
