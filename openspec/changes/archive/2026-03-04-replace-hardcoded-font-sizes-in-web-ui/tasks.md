## 1. Add new fontSize tokens

- [x] 1.1 Add `caption` (13), `body` (15), `title` (22), `iconMd` (28), `iconLg` (40) to `fontSize` in `packages/shared/src/theme/typography.ts`, maintaining sorted order by value

## 2. Replace hardcoded fontSize — direct token mappings

- [x] 2.1 Replace hardcoded `fontSize: 10` → `fontSize.xs` (6 instances: TokenSelectorModal, TransactionItem, SwapRouteVisualization, TokenBadgesSection, TokenBadges)
- [x] 2.2 Replace hardcoded `fontSize: 12` → `fontSize.sm` (42 instances across 26 files)
- [x] 2.3 Replace hardcoded `fontSize: 14` → `fontSize.base` (44 instances across 28 files)
- [x] 2.4 Replace hardcoded `fontSize: 16` → `fontSize.md` (38 instances across 22 files)
- [x] 2.5 Replace hardcoded `fontSize: 18` → `fontSize.lg` (14 instances across 11 files)
- [x] 2.6 Replace hardcoded `fontSize: 20` → `fontSize.xl` (17 instances across 14 files)
- [x] 2.7 Replace hardcoded `fontSize: 24` → `fontSize['2xl']` (11 instances across 8 files)
- [x] 2.8 Replace hardcoded `fontSize: 36` → `fontSize['4xl']` and `fontSize: 48` → `fontSize['5xl']` (2 instances)

## 3. Replace hardcoded fontSize — new token mappings

- [x] 3.1 Replace hardcoded `fontSize: 13` → `fontSize.caption` (23 instances across 18 files)
- [x] 3.2 Replace hardcoded `fontSize: 15` → `fontSize.body` (12 instances across 8 files)
- [x] 3.3 Replace hardcoded `fontSize: 22` → `fontSize.title` (3 instances: StepConfirmation, TransactionSuccessScreen, TransactionItem)

## 4. Replace hardcoded fontSize — rounded to nearest token

- [x] 4.1 Replace hardcoded `fontSize: 11` → `fontSize.xs` (12 instances across 9 files)
- [x] 4.2 Replace hardcoded `fontSize: 25` → `fontSize['2xl']` (1 instance: SwapReviewCard)
- [x] 4.3 Replace hardcoded `fontSize: 32` → `fontSize['3xl']` (1 instance: StepConfirmation)

## 5. Replace hardcoded fontSize — icon sizes with new tokens

- [x] 5.1 Replace hardcoded `fontSize: 28` → `fontSize.iconMd` (2 instances: AccountAddPanel)
- [x] 5.2 Replace hardcoded `fontSize: 40` → `fontSize.iconLg` (2 instances: PrivateKeyPanel, BackupPanel)

## 6. Verification

- [x] 6.1 Run `grep -rn 'fontSize:\s*[0-9]' packages/ui/src/ --include='*.tsx' --include='*.ts'` and confirm zero matches that don't reference `fontSize.`
- [x] 6.2 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and confirm zero errors
