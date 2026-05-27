## ADDED Requirements

### Requirement: Deduplicate paginated transactions
When loading additional pages of transaction history, duplicate transactions (same `id`) must be filtered out before appending to the existing list.

#### Scenario: Boundary overlap on loadMore
- **WHEN** a paginated fetch returns transactions that already exist in the current state (overlapping boundary transactions)
- **THEN** only new (unseen) transactions are appended, preserving existing order

#### Scenario: No duplicates on loadMore
- **WHEN** a paginated fetch returns all-new transactions with no overlap
- **THEN** all transactions are appended as before (no behavioral change)

#### Scenario: Entirely duplicate page
- **WHEN** a paginated fetch returns only transactions that already exist in state
- **THEN** no transactions are appended, and the cursor advances normally via `oldestSignatureRef`
