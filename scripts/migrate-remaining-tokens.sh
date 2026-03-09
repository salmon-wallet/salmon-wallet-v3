#!/bin/bash
# Migrate remaining hardcoded spacing, fontSize, borderRadius, and letterSpacing values
# to use shared design tokens in apps/mobile/src/components/

COMPONENTS_DIR="apps/mobile/src/components"

echo "=== Phase 1: Remaining spacing values in padding/margin/gap ==="
# Pattern: (padding|margin|gap)X: (vs|s)(N) → (vs|s)(spacing.TOKEN)
# Only replace in StyleSheet contexts

# s(2) → s(spacing.xxs)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(2)' {} \; | while read f; do
  perl -pi -e 's/(?<=[:(,\s])s\(2\)/s(spacing.xxs)/g' "$f"
done

# vs(2) → vs(spacing.xxs)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(2)' {} \; | while read f; do
  perl -pi -e 's/(?<=[:(,\s])vs\(2\)/vs(spacing.xxs)/g' "$f"
done

# s(6) → s(spacing.sm - 2) — skip, no exact token
# vs(6) → vs(spacing.sm - 2) — skip, no exact token

# s(8) → s(spacing.sm) — only in padding/margin/gap contexts
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l '[^0-9]s(8)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): s\(8\)/$1: s(spacing.sm)/g' "$f"
done

# vs(8) → vs(spacing.sm) — in spacing contexts
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(8)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): vs\(8\)/$1: vs(spacing.sm)/g' "$f"
done

# s(12) → s(spacing.md)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(12)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): s\(12\)/$1: s(spacing.md)/g' "$f"
done

# vs(12) → vs(spacing.md)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(12)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): vs\(12\)/$1: vs(spacing.md)/g' "$f"
done

# s(14) → s(spacing.base + 4) — skip, no exact token

# s(16) → s(spacing.lg)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(16)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): s\(16\)/$1: s(spacing.lg)/g' "$f"
done

# vs(16) → vs(spacing.lg)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(16)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): vs\(16\)/$1: vs(spacing.lg)/g' "$f"
done

# s(18) → s(spacing.headerPadding)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(18)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): s\(18\)/$1: s(spacing.headerPadding)/g' "$f"
done

# s(20) → s(spacing.xl)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l '[^0-9]s(20)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): s\(20\)/$1: s(spacing.xl)/g' "$f"
done

# vs(20) → vs(spacing.xl)
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(20)' {} \; | while read f; do
  perl -pi -e 's/(padding\w*|margin\w*|gap|bottom|top|left|right): vs\(20\)/$1: vs(spacing.xl)/g' "$f"
done

# s(24) → s(spacing['2xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(24)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): s\\(24\\)/\$1: s(spacing['2xl'])/g" "$f"
done

# vs(24) → vs(spacing['2xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(24)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): vs\\(24\\)/\$1: vs(spacing['2xl'])/g" "$f"
done

# vs(30) → vs(spacing['3.5xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(30)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): vs\\(30\\)/\$1: vs(spacing['3.5xl'])/g" "$f"
done

# s(32) → s(spacing['3xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 's(32)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): s\\(32\\)/\$1: s(spacing['3xl'])/g" "$f"
done

# vs(32) → vs(spacing['3xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(32)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): vs\\(32\\)/\$1: vs(spacing['3xl'])/g" "$f"
done

# vs(60) → vs(spacing['5.5xl'])
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'vs(60)' {} \; | while read f; do
  perl -pi -e "s/(padding\\w*|margin\\w*|gap|bottom|top|left|right): vs\\(60\\)/\$1: vs(spacing['5.5xl'])/g" "$f"
done

echo "=== Phase 2: letterSpacing with exact tokens ==="
# letterSpacing: 0.3 → letterSpacing.semiWide
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'letterSpacing: 0.3' {} \; | while read f; do
  perl -pi -e 's/letterSpacing: 0\.3,/letterSpacing: letterSpacing.semiWide,/g' "$f"
done

# letterSpacing: 0.24 → letterSpacing.wide (closest: 0.25)
# letterSpacing: 0.18 → letterSpacing.header (closest: 0.12) — skip, not close enough
# letterSpacing: 0.14 → letterSpacing.change (closest: 0.13) — skip, not close enough
# letterSpacing: 0.02 → close to 0, skip
# letterSpacing: 0.018 → close to 0, skip
# letterSpacing: 0.01 → close to 0, skip

echo "=== Phase 3: marginHorizontal/marginVertical with tokens ==="
# Catch marginHorizontal: s(N) patterns too
find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'marginHorizontal: s(8)' {} \; | while read f; do
  perl -pi -e 's/marginHorizontal: s\(8\)/marginHorizontal: s(spacing.sm)/g' "$f"
done

find "$COMPONENTS_DIR" -name "*.tsx" -exec grep -l 'marginHorizontal: s(12)' {} \; | while read f; do
  perl -pi -e 's/marginHorizontal: s\(12\)/marginHorizontal: s(spacing.md)/g' "$f"
done

echo "=== Done ==="
