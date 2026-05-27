## ADDED Requirements

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
