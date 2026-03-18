## ADDED Requirements

### Requirement: Transaction detail modal SHALL use BottomSheetContainer
The `TransactionDetailModal` in `apps/mobile/src/components/TransactionDetailModal/` SHALL use `BottomSheetContainer` as its outer wrapper instead of a standalone `Modal` + `GestureHandlerRootView`. This ensures gesture compatibility when opened from within another bottom sheet.

#### Scenario: Long press opens detail modal from transaction history
- **WHEN** user long-presses a transaction item inside `TransactionHistorySheet`
- **THEN** haptic feedback (medium impact) SHALL fire
- **THEN** `TransactionDetailModal` SHALL appear as a `BottomSheetContainer`
- **THEN** gestures (drag-to-dismiss, backdrop tap) SHALL work correctly

#### Scenario: Detail modal is dismissible
- **WHEN** user drags the detail modal sheet down past the threshold
- **THEN** the sheet SHALL dismiss with the standard close animation
- **WHEN** user taps the backdrop behind the detail modal
- **THEN** the sheet SHALL dismiss

### Requirement: BottomSheetContainer backdrop SHALL not block touches when closed
The `BottomSheetContainer` backdrop SHALL have `pointerEvents="none"` during close animation so that touches pass through to underlying content.

#### Scenario: Sheet closes and screen remains interactive
- **WHEN** a `BottomSheetContainer` sheet closes
- **THEN** the backdrop animated view SHALL NOT intercept touches during the close animation
- **THEN** the screen below SHALL be fully interactive after close completes

#### Scenario: Sheet close resets all animated values
- **WHEN** `completeClose()` is called after close animation finishes
- **THEN** `backdropOpacity` SHALL be reset to 0
- **THEN** `dragY` SHALL be reset to 0
- **THEN** `isRendered` SHALL be set to `false`

### Requirement: Transaction detail content SHALL be preserved
The transaction detail modal SHALL display all existing information: transaction type icon, amount, status, date, sender/receiver addresses with copy, transaction hash with copy, explorer link, share button, and developer-mode fields (block number, fee, slot).

#### Scenario: User views transaction detail
- **WHEN** transaction detail modal opens with a transaction
- **THEN** all transaction fields SHALL render correctly
- **THEN** copy-to-clipboard, explorer link, and share actions SHALL work
