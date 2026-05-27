## 1. Add new spacing token

- [x] 1.1 Add `'3.5xl': 30` to `spacing` in `packages/shared/src/theme/spacing.ts`

## 2. Replace hardcoded spacing — direct token mappings

- [x] 2.1 Replace hardcoded spacing `2` → `spacing['2xs']` (~14 instances)
- [x] 2.2 Replace hardcoded spacing `4` → `spacing.xs` (~18 instances)
- [x] 2.3 Replace hardcoded spacing `8` → `spacing.sm` (~20 instances)
- [x] 2.4 Replace hardcoded spacing `10` → `spacing.base` (~4 instances)
- [x] 2.5 Replace hardcoded spacing `12` → `spacing.md` (~17 instances)
- [x] 2.6 Replace hardcoded spacing `16` → `spacing.lg` (~10 instances)
- [x] 2.7 Replace hardcoded spacing `18` → `spacing.headerPadding` (1 instance)
- [x] 2.8 Replace hardcoded spacing `24` → `spacing['2xl']` (~2 instances)
- [x] 2.9 Replace hardcoded spacing `32` → `spacing['3xl']`, `48` → `spacing['5xl']` (2 instances)

## 3. Replace hardcoded spacing — rounded up to nearest token

- [x] 3.1 Replace hardcoded spacing `3` → `spacing.xs` (1 instance: TransactionDetailModal)
- [x] 3.2 Replace hardcoded spacing `6` → `spacing.sm` (11 instances across NftDetailPage, TransactionItem, TransactionHistoryPage, SwapRouteVisualization, TransactionDetailModal)
- [x] 3.3 Replace hardcoded spacing `7` → `spacing.sm` (1 instance: NftDetailPage)
- [x] 3.4 Replace hardcoded spacing `14` → `spacing.lg` (3 instances: TransactionItem, TransactionHistoryPage)

## 4. Replace hardcoded spacing — new token

- [x] 4.1 Replace hardcoded spacing `30` → `spacing['3.5xl']` (2 instances: BalanceCardCarousel)

## 5. Convert padding strings to token template literals

- [x] 5.1 Convert padding strings like `'14px 16px'`, `'3px 8px'`, `'8px 24px'`, `'6px 10px'`, `'2px 4px'`, `'0 6px'`, `'12px 16px'`, `'16px 0'`, `'24px'`, `'0 16px'`, `'8px 0'` to use spacing token references in template literals

## 6. Verification

- [x] 6.1 Grep for remaining hardcoded spacing values and confirm zero matches
- [x] 6.2 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and confirm zero errors
