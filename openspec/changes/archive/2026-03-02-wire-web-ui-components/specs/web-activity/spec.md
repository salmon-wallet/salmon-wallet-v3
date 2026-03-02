## ADDED Requirements

### Requirement: ActivityRoute renders TransactionHistoryPage with real data
The ActivityRoute SHALL render TransactionHistoryPage from `@salmon/ui` wired with `useTransactions()` hook data including transactions array, loading states, infinite scroll, and error handling.

#### Scenario: User views transaction history
- **WHEN** user navigates to `/activity`
- **THEN** TransactionHistoryPage shows the list of transactions for the active account and network

#### Scenario: Infinite scroll
- **WHEN** user scrolls to the bottom of the transaction list and `hasMore` is true
- **THEN** `loadMore()` is called and additional transactions appear below

#### Scenario: Error state
- **WHEN** transaction fetch fails
- **THEN** TransactionHistoryPage shows the error message with a retry button that calls `refresh()`

### Requirement: ActivityRoute shows TransactionDetailModal
The ActivityRoute SHALL render TransactionDetailModal from `@salmon/ui` when user clicks a transaction.

#### Scenario: User clicks a transaction
- **WHEN** user clicks a transaction row
- **THEN** TransactionDetailModal opens showing full transaction details (hash, type, status, amounts, fee, timestamp)

#### Scenario: User closes transaction detail
- **WHEN** user closes TransactionDetailModal
- **THEN** modal hides and transaction list remains visible

### Requirement: ActivityRoute back navigation
The onBack callback SHALL navigate to `/home`.

#### Scenario: User goes back
- **WHEN** user clicks back button on TransactionHistoryPage
- **THEN** app navigates to `/home`
