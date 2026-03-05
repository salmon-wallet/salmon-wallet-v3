#!/bin/bash
# Migrate hardcoded fontSize and borderRadius values inside ms() to use design tokens
# Context-aware: only replaces fontSize: ms(N) and borderRadius: ms(N) patterns

COMPONENTS_DIR="apps/mobile/src/components"

echo "=== Phase 1: fontSize replacements ==="
# fontSize: ms(10) → ms(fontSize.xs)
perl -pi -e 's/fontSize: ms\(10\)/fontSize: ms(fontSize.xs)/g' $(grep -rl 'fontSize: ms(10)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(12) → ms(fontSize.sm)
perl -pi -e 's/fontSize: ms\(12\)/fontSize: ms(fontSize.sm)/g' $(grep -rl 'fontSize: ms(12)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(14) → ms(fontSize.base)
perl -pi -e 's/fontSize: ms\(14\)/fontSize: ms(fontSize.base)/g' $(grep -rl 'fontSize: ms(14)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(16) → ms(fontSize.md)
perl -pi -e 's/fontSize: ms\(16\)/fontSize: ms(fontSize.md)/g' $(grep -rl 'fontSize: ms(16)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(18) → ms(fontSize.lg)
perl -pi -e 's/fontSize: ms\(18\)/fontSize: ms(fontSize.lg)/g' $(grep -rl 'fontSize: ms(18)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(20) → ms(fontSize.xl)
perl -pi -e 's/fontSize: ms\(20\)/fontSize: ms(fontSize.xl)/g' $(grep -rl 'fontSize: ms(20)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(22) → ms(fontSize.title)
perl -pi -e 's/fontSize: ms\(22\)/fontSize: ms(fontSize.title)/g' $(grep -rl 'fontSize: ms(22)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(24) → ms(fontSize['"'"'2xl'"'"'])
perl -pi -e "s/fontSize: ms\\(24\\)/fontSize: ms(fontSize['2xl'])/g" $(grep -rl 'fontSize: ms(24)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# fontSize: ms(36) → ms(fontSize['"'"'4xl'"'"'])
perl -pi -e "s/fontSize: ms\\(36\\)/fontSize: ms(fontSize['4xl'])/g" $(grep -rl 'fontSize: ms(36)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)

echo "=== Phase 2: borderRadius replacements ==="
# borderRadius: ms(8) → ms(borderRadius.md)
perl -pi -e 's/borderRadius: ms\(8\)/borderRadius: ms(borderRadius.md)/g' $(grep -rl 'borderRadius: ms(8)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# borderRadius: ms(9) → ms(borderRadius.badge)
perl -pi -e 's/borderRadius: ms\(9\)/borderRadius: ms(borderRadius.badge)/g' $(grep -rl 'borderRadius: ms(9)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# borderRadius: ms(12) → ms(borderRadius.lg)
perl -pi -e 's/borderRadius: ms\(12\)/borderRadius: ms(borderRadius.lg)/g' $(grep -rl 'borderRadius: ms(12)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# borderRadius: ms(14) → ms(borderRadius.button)
perl -pi -e 's/borderRadius: ms\(14\)/borderRadius: ms(borderRadius.button)/g' $(grep -rl 'borderRadius: ms(14)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# borderRadius: ms(16) → ms(borderRadius.xl)
perl -pi -e 's/borderRadius: ms\(16\)/borderRadius: ms(borderRadius.xl)/g' $(grep -rl 'borderRadius: ms(16)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)
# borderRadius: ms(18) → ms(borderRadius.iconContainer)
perl -pi -e 's/borderRadius: ms\(18\)/borderRadius: ms(borderRadius.iconContainer)/g' $(grep -rl 'borderRadius: ms(18)' "$COMPONENTS_DIR" --include="*.tsx" 2>/dev/null)

echo "=== Phase 3: Also handle lineHeight that references fontSize values ==="
# lineHeight: ms(18) when following fontSize.base → ms(fontSize.lg) equivalent
# Skip lineHeight for now - these are computed values

echo "=== Done ==="
