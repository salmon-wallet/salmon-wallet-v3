## 1. SecondaryButton — `buttonVariant`

- [x] 1.1 In `packages/ui/src/components/Button/SecondaryButton.tsx`: remove `shouldForwardProp` option, rename `buttonVariant` to `$buttonVariant` in generic type (line 23), destructuring (line 24), and JSX usage (line 84). Keep `fullWidth` unprefixed (valid MUI Button prop).

## 2. TextButton — `customColor`

- [x] 2.1 In `packages/ui/src/components/Button/TextButton.tsx`: remove `shouldForwardProp` option, rename `customColor` to `$customColor` in generic type (line 22), destructuring (line 23), and JSX usage (line 79).

## 3. PasswordStrengthBar — `active`, `barColor`, `labelColor`

- [x] 3.1 In `packages/ui/src/components/PasswordInput/PasswordStrengthBar.tsx`: remove `shouldForwardProp` from `Bar` (line 32) and `Label` (line 44). Rename `active` to `$active` and `barColor` to `$barColor` in Bar, rename `labelColor` to `$labelColor` in Label — update generic types, destructuring, and all JSX usage sites (lines 106-113).

## 4. TokenBadgesSection — `badgeColor`

- [x] 4.1 In `packages/ui/src/components/TokenDetailPage/TokenBadgesSection.tsx`: remove `shouldForwardProp` from `BadgeIconWrapper` (line 233) and `BadgeLabel` (line 246). Rename `badgeColor` to `$badgeColor` in both — update generic types, destructuring, and JSX usage (lines 285, 288).

## 5. TokenFeatures — `badgeColor`, `labelColor`

- [x] 5.1 In `packages/ui/src/components/TokenFeatures/TokenFeatures.tsx`: remove `shouldForwardProp` from `Badge` (line 109) and `BadgeLabel` (line 125). Rename `badgeColor` to `$badgeColor` in Badge, rename `labelColor` to `$labelColor` in BadgeLabel — update generic types, destructuring, and JSX usage (lines 179, 181).

## 6. Verification

- [x] 6.1 Run `pnpm turbo run typecheck --filter=@salmon/ui` to confirm no type errors
- [x] 6.2 Grep `packages/ui/src/` for `shouldForwardProp` to confirm zero results (only `utils/styled.ts` infrastructure remains)
