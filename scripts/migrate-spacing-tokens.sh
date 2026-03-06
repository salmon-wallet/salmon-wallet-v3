#!/bin/bash
# Migrate hardcoded spacing values to design tokens in mobile components
# Usage: bash scripts/migrate-spacing-tokens.sh [--dry-run]

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPONENTS="$ROOT/apps/mobile/src/components"
DRY_RUN="${1:-}"

replace_in_file() {
  local file="$1"
  local pattern="$2"
  local replacement="$3"

  if [ "$DRY_RUN" = "--dry-run" ]; then
    grep -n "$pattern" "$file" 2>/dev/null | head -5
  else
    perl -pi -e "$replacement" "$file"
  fi
}

echo "=== Migrating spacing tokens in mobile components ==="
echo ""

# Track changed files for import verification
CHANGED_FILES=()

# ============================================================================
# PHASE 1: Replace spacing values (padding, margin, gap)
# ============================================================================
echo "--- Phase 1: Spacing (padding/margin/gap) ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  # Skip files that already use s()/vs()/ms() wrappers exclusively
  # We only target raw numeric values

  changed=0

  # spacing.xxs = 2
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*2[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*2(?=[,\s}])/$1: spacing.xxs/g' "$file"
    changed=1
  fi

  # spacing.xs = 4
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*4[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*4(?=[,\s}])/$1: spacing.xs/g' "$file"
    changed=1
  fi

  # spacing.sm = 8
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*8[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*8(?=[,\s}])/$1: spacing.sm/g' "$file"
    changed=1
  fi

  # spacing.base = 10
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*10[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*10(?=[,\s}])/$1: spacing.base/g' "$file"
    changed=1
  fi

  # spacing.md = 12
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*12[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*12(?=[,\s}])/$1: spacing.md/g' "$file"
    changed=1
  fi

  # spacing.lg = 16
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*16[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*16(?=[,\s}])/$1: spacing.lg/g' "$file"
    changed=1
  fi

  # spacing.headerPadding = 18
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*18[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*18(?=[,\s}])/$1: spacing.headerPadding/g' "$file"
    changed=1
  fi

  # spacing.xl = 20
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*20[,\s}]' "$file"; then
    perl -pi -e 's/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*20(?=[,\s}])/$1: spacing.xl/g' "$file"
    changed=1
  fi

  # spacing['2xl'] = 24
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*24[,\s}]' "$file"; then
    perl -pi -e "s/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*24(?=[,\s}])/\$1: spacing['2xl']/g" "$file"
    changed=1
  fi

  # spacing['3xl'] = 32
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*32[,\s}]' "$file"; then
    perl -pi -e "s/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*32(?=[,\s}])/\$1: spacing['3xl']/g" "$file"
    changed=1
  fi

  # spacing['4xl'] = 40
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*40[,\s}]' "$file"; then
    perl -pi -e "s/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*40(?=[,\s}])/\$1: spacing['4xl']/g" "$file"
    changed=1
  fi

  # spacing['5xl'] = 48
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*48[,\s}]' "$file"; then
    perl -pi -e "s/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*48(?=[,\s}])/\$1: spacing['5xl']/g" "$file"
    changed=1
  fi

  # spacing['5.5xl'] = 60
  if grep -qE '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom|Left|Right)?:\s*60[,\s}]' "$file"; then
    perl -pi -e "s/((?:padding|margin|gap)(?:Horizontal|Vertical|Top|Bottom|Left|Right)?):\s*60(?=[,\s}])/\$1: spacing['5.5xl']/g" "$file"
    changed=1
  fi

  if [ $changed -eq 1 ]; then
    echo "  [spacing] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

# ============================================================================
# PHASE 2: Replace borderRadius values
# ============================================================================
echo ""
echo "--- Phase 2: Border radius ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  changed=0

  # borderRadius.scrollbar = 2
  if grep -qE 'borderRadius:\s*2[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*2(?=[,\s}])/borderRadius: borderRadius.scrollbar/g' "$file"
    changed=1
  fi

  # borderRadius.sm = 4
  if grep -qE 'borderRadius:\s*4[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*4(?=[,\s}])/borderRadius: borderRadius.sm/g' "$file"
    changed=1
  fi

  # borderRadius.md = 8
  if grep -qE 'borderRadius:\s*8[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*8(?=[,\s}])/borderRadius: borderRadius.md/g' "$file"
    changed=1
  fi

  # borderRadius.badge = 9
  if grep -qE 'borderRadius:\s*9[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*9(?=[,\s}])/borderRadius: borderRadius.badge/g' "$file"
    changed=1
  fi

  # borderRadius.lg = 12
  if grep -qE 'borderRadius:\s*12[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*12(?=[,\s}])/borderRadius: borderRadius.lg/g' "$file"
    changed=1
  fi

  # borderRadius.button = 14
  if grep -qE 'borderRadius:\s*14[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*14(?=[,\s}])/borderRadius: borderRadius.button/g' "$file"
    changed=1
  fi

  # borderRadius.xl = 16
  if grep -qE 'borderRadius:\s*16[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*16(?=[,\s}])/borderRadius: borderRadius.xl/g' "$file"
    changed=1
  fi

  # borderRadius.iconContainer = 18
  if grep -qE 'borderRadius:\s*18[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*18(?=[,\s}])/borderRadius: borderRadius.iconContainer/g' "$file"
    changed=1
  fi

  # borderRadius.iconLg = 20
  if grep -qE 'borderRadius:\s*20[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*20(?=[,\s}])/borderRadius: borderRadius.iconLg/g' "$file"
    changed=1
  fi

  # borderRadius.tokenIcon = 22
  if grep -qE 'borderRadius:\s*22[,\s}]' "$file"; then
    perl -pi -e 's/borderRadius:\s*22(?=[,\s}])/borderRadius: borderRadius.tokenIcon/g' "$file"
    changed=1
  fi

  if [ $changed -eq 1 ]; then
    echo "  [borderRadius] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

# ============================================================================
# PHASE 3: Replace fontSize values
# ============================================================================
echo ""
echo "--- Phase 3: Font sizes ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  changed=0

  # fontSize.xs = 10
  if grep -qE 'fontSize:\s*10[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*10(?=[,\s}])/fontSize: fontSize.xs/g' "$file"
    changed=1
  fi

  # fontSize.sm = 12
  if grep -qE 'fontSize:\s*12[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*12(?=[,\s}])/fontSize: fontSize.sm/g' "$file"
    changed=1
  fi

  # fontSize.base = 14
  if grep -qE 'fontSize:\s*14[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*14(?=[,\s}])/fontSize: fontSize.base/g' "$file"
    changed=1
  fi

  # fontSize.md = 16
  if grep -qE 'fontSize:\s*16[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*16(?=[,\s}])/fontSize: fontSize.md/g' "$file"
    changed=1
  fi

  # fontSize.lg = 18
  if grep -qE 'fontSize:\s*18[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*18(?=[,\s}])/fontSize: fontSize.lg/g' "$file"
    changed=1
  fi

  # fontSize.xl = 20
  if grep -qE 'fontSize:\s*20[,\s}]' "$file"; then
    perl -pi -e 's/fontSize:\s*20(?=[,\s}])/fontSize: fontSize.xl/g' "$file"
    changed=1
  fi

  # fontSize['2xl'] = 24
  if grep -qE 'fontSize:\s*24[,\s}]' "$file"; then
    perl -pi -e "s/fontSize:\s*24(?=[,\s}])/fontSize: fontSize['2xl']/g" "$file"
    changed=1
  fi

  # fontSize['4xl'] = 36
  if grep -qE 'fontSize:\s*36[,\s}]' "$file"; then
    perl -pi -e "s/fontSize:\s*36(?=[,\s}])/fontSize: fontSize['4xl']/g" "$file"
    changed=1
  fi

  if [ $changed -eq 1 ]; then
    echo "  [fontSize] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

# ============================================================================
# PHASE 4: Replace lineHeight raw values
# ============================================================================
echo ""
echo "--- Phase 4: Line heights ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  changed=0

  # These are absolute pixel values that need to stay as-is or be computed
  # lineHeight tokens are multipliers (1.0, 1.25, 1.3, etc.), not pixel values
  # Raw pixel lineHeight values (18, 20, 22, 24, 32) need fontSize * multiplier
  # Skip these for now - they'll be handled manually

  if [ $changed -eq 1 ]; then
    echo "  [lineHeight] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

# ============================================================================
# PHASE 5: Replace letterSpacing values
# ============================================================================
echo ""
echo "--- Phase 5: Letter spacing ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  changed=0

  # letterSpacing.wider = 0.5
  if grep -qE 'letterSpacing:\s*0\.5[,\s}]' "$file"; then
    perl -pi -e 's/letterSpacing:\s*0\.5(?=[,\s}])/letterSpacing: letterSpacing.wider/g' "$file"
    changed=1
  fi

  if [ $changed -eq 1 ]; then
    echo "  [letterSpacing] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

# ============================================================================
# PHASE 6: Replace borderWidth values
# ============================================================================
echo ""
echo "--- Phase 6: Border widths ---"

find "$COMPONENTS" -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | sort | while read -r file; do
  changed=0

  # borderWidth.accent = 0.8
  if grep -qE 'borderWidth:\s*0\.8[,\s}]' "$file"; then
    perl -pi -e 's/borderWidth:\s*0\.8(?=[,\s}])/borderWidth: borderWidth.accent/g' "$file"
    changed=1
  fi

  # borderWidth.tokenListItem = 0.75 (for non-sheet contexts)
  if grep -qE 'borderWidth:\s*0\.75[,\s}]' "$file"; then
    perl -pi -e 's/borderWidth:\s*0\.75(?=[,\s}])/borderWidth: borderWidth.sheet/g' "$file"
    changed=1
  fi

  if [ $changed -eq 1 ]; then
    echo "  [borderWidth] $(basename "$(dirname "$file")")/$(basename "$file")"
  fi
done

echo ""
echo "=== Migration complete ==="
echo "Run 'pnpm turbo run typecheck' to verify"
