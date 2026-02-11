# Type Duplication Audit - @salmon/shared

## Executive Summary

**Problem:** Multiple type definitions exist within `@salmon/shared`, causing export conflicts when trying to consolidate UI types.

**Impact:** Blocks migration of duplicate types from `packages/ui` and `packages/ui-extension` to shared package.

---

## Duplicate Types Identified

### 1. `TransactionStatus` ⚠️ **CONFLICT**

**Location 1:** `packages/shared/src/types/transaction.ts`
```typescript
export type TransactionStatus =
  | 'success' | 'fail' | 'warning' | 'creating' | 'sending'
  | 'listing' | 'unlisting' | 'creating-offer' | 'canceling-offer'
  | 'buying' | 'swapping' | 'bridging' | 'bridge_success';
```
**Purpose:** Internal wallet transaction lifecycle states (13 states)
**Used by:** Internal transaction management, UI transaction status display

**Location 2:** `packages/shared/src/hooks/useTransactions.ts`
```typescript
export type HistoryTransactionStatus = 'completed' | 'failed' | 'pending';
```
**Purpose:** Simplified history display states (3 states)
**Used by:** Transaction history UI components

**Location 3:** `packages/ui` and `packages/ui-extension`
```typescript
export type TransactionStatus = 'completed' | 'failed' | 'pending';
```
**Purpose:** Transaction history display (same as HistoryTransactionStatus)
**Used by:** TransactionHistorySheet, TransactionItem

**Resolution:** These are DIFFERENT types for different purposes:
- Keep `TransactionStatus` in `types/transaction.ts` for internal wallet states
- Rename `HistoryTransactionStatus` → `TransactionDisplayStatus` for UI display
- UI components should use `TransactionDisplayStatus`

---

### 2. `TransactionType` 🔴 **DUPLICATE**

**Location 1:** `packages/shared/src/api/services/transactions.ts`
```typescript
export type TransactionType = 'send' | 'receive' | 'swap' | 'unknown';
```
**Purpose:** API transaction classification (4 types)
**Used by:** Multi-chain transaction API (Bitcoin, Ethereum)

**Location 2:** `packages/shared/src/hooks/useTransactions.ts`
```typescript
export type HistoryTransactionType =
  | 'send' | 'receive' | 'swap' | 'mint' | 'burn'
  | 'stake' | 'loan' | 'interaction' | 'unknown';
```
**Purpose:** Extended transaction types for Solana (9 types)
**Used by:** Transaction history hook, UI components

**Location 3:** `packages/ui` and `packages/ui-extension`
```typescript
export type TransactionType =
  | 'send' | 'receive' | 'swap' | 'mint' | 'burn'
  | 'stake' | 'loan' | 'interaction' | 'unknown';
```
**Purpose:** UI display (same as HistoryTransactionType)

**Resolution:**
- The API version is TOO LIMITED (only 4 types)
- The extended version (9 types) should be canonical
- Consolidate into `packages/shared/src/types/transaction.ts` as `TransactionType`
- Update API to use the canonical type

---

### 3. `TransactionTokenAmount` 🔴 **DUPLICATE**

**Location 1:** `packages/shared/src/api/services/transactions.ts`
```typescript
export interface TransactionTokenAmount {
  amount: string;
  decimals: number;
  symbol: string;
  name?: string;
  logo?: string | null;
  contract: string;
  source?: string;
  destination?: string;
}
```
**Purpose:** API response format (8 fields)

**Location 2:** `packages/shared/src/hooks/useTransactions.ts`
```typescript
export interface TransactionTokenAmount {
  amount: string;
  decimals: number;
  symbol: string;
  name?: string;
  logo?: string | null;
  contract: string;
  source?: string;
  destination?: string;
  isNft?: boolean;  // Additional field
}
```
**Purpose:** Hook data format (9 fields - adds isNft)

**Location 3:** `packages/ui` and `packages/ui-extension`
```typescript
export interface TransactionTokenAmount {
  amount: string;
  decimals: number;
  symbol: string;
  name?: string;
  logo?: string | null;
  contract: string;
  source?: string;
  destination?: string;
  isNft?: boolean;
  nftCollection?: string;          // NFT-specific fields
  nftCollectionVerified?: boolean;
  nftMedia?: string;
  nftAttributes?: NftAttribute[];
}
```
**Purpose:** Full UI display format (13 fields - complete NFT support)

**Resolution:**
- UI version is the MOST COMPLETE
- Consolidate into `packages/shared/src/types/transaction.ts`
- API and hook can use the same type (extra fields optional)

---

### 4. `TransactionFee` 🔴 **DUPLICATE**

**Location 1:** `packages/shared/src/api/services/transactions.ts`
```typescript
export interface TransactionFee {
  amount: string;  // string
  decimals: number;
  symbol: string;
}
```

**Location 2:** `packages/shared/src/hooks/useTransactions.ts`
```typescript
export interface TransactionFee {
  amount: number;  // number ⚠️ DIFFERENT TYPE
  decimals: number;
  symbol: string;
}
```

**Location 3:** `packages/ui` and `packages/ui-extension`
```typescript
export interface TransactionFee {
  amount: number;  // number
  decimals: number;
  symbol: string;
}
```

**Resolution:**
- Type conflict: API uses `string`, others use `number`
- **Decision:** Use `number` as canonical (safer for math operations)
- Update API to parse string to number on response

---

### 5. `NftAttribute` 🟢 **IDENTICAL**

**Location 1:** `packages/shared/src/blockchain/solana/nft.ts`
```typescript
export interface NftAttribute {
  trait_type: string;
  value: string | number;
}
```

**Location 2:** `packages/ui` and `packages/ui-extension`
```typescript
export interface NftAttribute {
  trait_type: string;
  value: string | number;
}
```

**Resolution:**
- Already exists in shared! ✅
- UI can import from `@salmon/shared`
- Path: `packages/shared/src/blockchain/solana/nft.ts`

---

## Consolidation Plan

### Phase 1: Create Canonical Types

Create `packages/shared/src/types/transaction.ts` (enhanced):

```typescript
// ============================================================================
// Transaction Display Types
// ============================================================================

/**
 * Transaction types for display and classification
 * Covers all blockchain transaction categories
 */
export type TransactionType =
  | 'send'
  | 'receive'
  | 'swap'
  | 'mint'
  | 'burn'
  | 'stake'
  | 'loan'
  | 'interaction'
  | 'unknown';

/**
 * Transaction display status for history views
 * Simplified from internal TransactionStatus
 */
export type TransactionDisplayStatus = 'completed' | 'failed' | 'pending';

/**
 * NFT attribute for metadata
 * Re-export from blockchain/solana/nft for convenience
 */
export type { NftAttribute } from '../blockchain/solana/nft';

/**
 * Token amount in a transaction
 * Supports both regular tokens and NFTs
 */
export interface TransactionTokenAmount {
  /** Raw amount (in smallest unit) */
  amount: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name?: string;
  /** Token logo URL */
  logo?: string | null;
  /** Token contract/mint address */
  contract: string;
  /** Source address (for receives) */
  source?: string;
  /** Destination address (for sends) */
  destination?: string;
  /** Whether this is an NFT */
  isNft?: boolean;
  /** NFT collection name */
  nftCollection?: string;
  /** Whether the NFT collection is verified */
  nftCollectionVerified?: boolean;
  /** NFT media URL (image/video) */
  nftMedia?: string;
  /** NFT metadata attributes */
  nftAttributes?: NftAttribute[];
}

/**
 * Transaction fee information
 */
export interface TransactionFee {
  /** Fee amount in smallest unit */
  amount: number;
  /** Fee decimals */
  decimals: number;
  /** Fee token symbol */
  symbol: string;
}
```

### Phase 2: Update Internal Shared References

1. **Update `api/services/transactions.ts`:**
   - Remove local type definitions
   - Import from `../types/transaction`
   - Parse API string amounts to numbers

2. **Update `hooks/useTransactions.ts`:**
   - Remove local type definitions
   - Import from `../types/transaction`
   - Remove `History` prefix from types

### Phase 3: Update UI Packages

1. **Update `packages/ui/src/components/TransactionHistorySheet/types.ts`:**
   - Remove all duplicate types
   - Import from `@salmon/shared`

2. **Update `packages/ui-extension/src/components/TransactionHistorySheet/types.ts`:**
   - Remove all duplicate types
   - Import from `@salmon/shared`

---

## Migration Checklist

- [ ] Create enhanced `types/transaction.ts` with canonical types
- [ ] Update `api/services/transactions.ts` to use canonical types
- [ ] Update `hooks/useTransactions.ts` to use canonical types
- [ ] Update UI packages to import from shared
- [ ] Run typecheck on @salmon/shared
- [ ] Run typecheck on @salmon/ui
- [ ] Run typecheck on @salmon/ui-extension
- [ ] Run typecheck on @salmon/mobile
- [ ] Remove `HistoryTransactionType` and `HistoryTransactionStatus` aliases
- [ ] Update all imports throughout codebase

---

## Risk Assessment

**Low Risk:**
- NftAttribute already exists in shared ✅
- Types are well-documented

**Medium Risk:**
- TransactionFee type mismatch (string vs number)
- Need to ensure API parsing handles conversion

**High Risk:**
- TransactionStatus has different meanings in different contexts
- Must preserve both internal (13 states) and display (3 states) versions

---

## Estimated Impact

- **Files to modify:** ~15-20 files
- **Lines removed:** ~500+ duplicate lines
- **Type safety improvement:** Significant (single source of truth)
- **Breaking changes:** Internal only (no public API changes)
