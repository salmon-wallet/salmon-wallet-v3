#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

count_usage() {
  local token="$1"
  local exclude="$2"
  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' -F "$token" "$ROOT" \
    | grep -v "node_modules" \
    | grep -v "$exclude" \
    | grep -v "audit-shadows-durations.sh" \
    | grep -v ".turbo")
  local count
  count=$(echo "$results" | grep -c . 2>/dev/null || echo "0")
  if [ "$count" -eq 0 ] || [ -z "$results" ]; then
    echo "  [$token] -> 0 uses  *** UNUSED ***"
  else
    echo "  [$token] -> $count uses"
  fi
}

SHADOW_FILE="packages/shared/src/theme/shadows.ts"

echo "=== shadows (RN) ==="
for key in none sm md lg xl header card logo balanceText glow sheet; do
  count_usage "shadows.$key" "$SHADOW_FILE"
done

echo ""
echo "=== shadows['2xl'] ==="
grep -rn --include='*.ts' --include='*.tsx' "shadows\[.*2xl" "$ROOT" \
  | grep -v node_modules | grep -v "$SHADOW_FILE" | grep -v .turbo | grep -c . 2>/dev/null \
  | xargs -I{} echo "  shadows['2xl'] -> {} uses"

echo ""
echo "=== shadowsCSS ==="
for key in none sm md lg xl header card balanceText glow button; do
  count_usage "shadowsCSS.$key" "$SHADOW_FILE"
done

echo ""
echo "=== shadowsCSS['2xl'] ==="
grep -rn --include='*.ts' --include='*.tsx' "shadowsCSS\[.*2xl" "$ROOT" \
  | grep -v node_modules | grep -v "$SHADOW_FILE" | grep -v .turbo | grep -c . 2>/dev/null \
  | xargs -I{} echo "  shadowsCSS['2xl'] -> {} uses"

DUR_FILE="packages/shared/src/theme/durations.ts"

echo ""
echo "=== duration (CSS strings) ==="
for key in instant fastest fast normal medium slow slower stagger1 stagger2 stagger3; do
  count_usage "duration.$key" "$DUR_FILE"
done

echo ""
echo "=== durationMs ==="
for key in instant fastest fast normal medium slow slower spin pulse feedbackShort shimmer debounce feedbackLong spinSlow; do
  count_usage "durationMs.$key" "$DUR_FILE"
done

echo ""
echo "=== easing ==="
for key in ease easeOut easeIn easeInOut standard slide bounce; do
  count_usage "easing.$key" "$DUR_FILE"
done
