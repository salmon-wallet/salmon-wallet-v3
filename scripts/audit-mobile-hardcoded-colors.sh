#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile/src/components"

echo "============================================"
echo "  HARDCODED COLORS IN MOBILE COMPONENTS"
echo "============================================"
echo ""

echo "=== HEX colors ==="
grep -rn --include='*.ts' --include='*.tsx' -E "'#[0-9a-fA-F]{3,8}'|\"#[0-9a-fA-F]{3,8}\"" "$MOBILE" \
  | grep -v node_modules | grep -v .turbo \
  | grep -v "import " | grep -v "require(" \
  | sed "s|$ROOT/||g"

echo ""
echo "=== RGBA colors ==="
grep -rn --include='*.ts' --include='*.tsx' -E "'rgba\([^)]+\)'|\"rgba\([^)]+\)\"" "$MOBILE" \
  | grep -v node_modules | grep -v .turbo \
  | sed "s|$ROOT/||g"

echo ""
echo "=== Named colors (transparent excluded) ==="
grep -rn --include='*.ts' --include='*.tsx' -E "color.*'(white|black|red|green|blue|grey|gray)'" "$MOBILE" \
  | grep -v node_modules | grep -v .turbo \
  | sed "s|$ROOT/||g"

echo ""
echo "=== Transparent ==="
grep -rn --include='*.ts' --include='*.tsx' -E "'transparent'" "$MOBILE" \
  | grep -v node_modules | grep -v .turbo \
  | grep -v "// " \
  | sed "s|$ROOT/||g"
