## Purpose

Renders the transaction activity page across all platforms (web, extension, mobile), wired to the shared `useTransactions` hook for multi-chain transaction history.

## Requirements

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

### Requirement: fetchBitcoinAccountRecentTransactions returns AccountTransactionListResponse shape
The `fetchBitcoinAccountRecentTransactions` function in `packages/shared/src/api/services/bitcoin.ts` SHALL transform the backend response from `{ data, meta }` into `{ items, nextPageToken }` matching the `AccountTransactionListResponse` type.

#### Scenario: Backend returns transactions successfully
- **WHEN** the backend returns `{ data: [tx1, tx2], meta: { nextPageToken: "abc" } }`
- **THEN** the function returns `{ items: [tx1, tx2], nextPageToken: "abc" }`

#### Scenario: Backend returns empty data
- **WHEN** the backend returns `{ data: [], meta: {} }`
- **THEN** the function returns `{ items: [], nextPageToken: undefined }`

#### Scenario: Backend returns data without nextPageToken
- **WHEN** the backend returns `{ data: [tx1], meta: {} }`
- **THEN** the function returns `{ items: [tx1], nextPageToken: undefined }`
