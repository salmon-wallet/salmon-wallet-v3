#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TYPO_FILE="packages/shared/src/theme/typography.ts"

count_usage() {
  local token="$1"
  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' -F "$token" "$ROOT" \
    | grep -v "node_modules" \
    | grep -v "$TYPO_FILE" \
    | grep -v "audit-typography.sh" \
    | grep -v ".turbo")
  local count
  count=$(echo "$results" | grep -c . 2>/dev/null || echo "0")
  if [ "$count" -eq 0 ] || [ -z "$results" ]; then
    echo "  [$token] -> 0 uses  *** UNUSED ***"
  else
    echo "  [$token] -> $count uses"
  fi
}

echo "=== fontFamily ==="
for key in sans mono; do
  count_usage "fontFamily.$key"
done

echo ""
echo "=== fontFamilyNative ==="
for key in light regular medium semiBold bold extraBold black; do
  count_usage "fontFamilyNative.$key"
done

echo ""
echo "=== fontSize ==="
for key in xs tokenChange sm tokenNamePrice base actionButton md lg xl title '2xl' '3xl' iconMd '4xl' iconLg '5xl' balance; do
  count_usage "fontSize.$key"
done

echo ""
echo "=== lineHeight ==="
for key in none compact tight condensed snug tokenListItem normal relaxed loose; do
  count_usage "lineHeight.$key"
done

echo ""
echo "=== fontWeight ==="
for key in light regular medium semibold bold extraBold black; do
  count_usage "fontWeight.$key"
done

echo ""
echo "=== letterSpacing ==="
for key in tighter tight snug slight normal header change wide semiWide balance wider widest; do
  count_usage "letterSpacing.$key"
done

echo ""
echo "=== textStyles ==="
for key in display h1 h2 h3 h4 bodyLarge body bodySmall caption button mono; do
  count_usage "textStyles.$key"
done
