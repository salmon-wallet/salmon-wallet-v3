#!/bin/bash
# Audit color token usage across the codebase
# Searches for colors.X.Y and gradients.X patterns in .ts/.tsx files
# Excludes the token definition file itself and node_modules

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COLORS_FILE="packages/shared/src/theme/colors.ts"

echo "============================================"
echo "  COLOR TOKEN USAGE AUDIT"
echo "============================================"
echo ""

# Function to count and list usages
count_usage() {
  local token="$1"
  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' "$token" "$ROOT" \
    | grep -v "node_modules" \
    | grep -v "$COLORS_FILE" \
    | grep -v "audit-colors.sh" \
    | grep -v ".turbo")

  local count
  count=$(echo "$results" | grep -c . 2>/dev/null || echo "0")

  if [ "$count" -eq 0 ] || [ -z "$results" ]; then
    echo "  [$token] -> 0 uses  *** UNUSED ***"
  else
    echo "  [$token] -> $count uses"
    echo "$results" | sed 's|'"$ROOT/"'||g' | while read -r line; do
      echo "    $line"
    done
  fi
  echo ""
}

echo "=== colors.background ==="
for key in primary secondary tertiary card glass tokenItem; do
  count_usage "colors.background.$key"
done

echo "=== colors.text ==="
for key in primary secondary tertiary muted balance placeholder disabled token tokenPrice; do
  count_usage "colors.text.$key"
done

echo "=== colors.border ==="
for key in default primary light subtle; do
  count_usage "colors.border.$key"
done

echo "=== colors.accent ==="
for key in primary primaryEnd border tint tintHover; do
  count_usage "colors.accent.$key"
done

echo "=== colors.status ==="
for key in success error warning successBackground errorBackground warningBackground warningBorder; do
  count_usage "colors.status.$key"
done

echo "=== colors.change ==="
for key in positive negative neutral; do
  count_usage "colors.change.$key"
done

echo "=== colors.input ==="
for key in background border borderFocus borderError borderSuccess; do
  count_usage "colors.input.$key"
done

echo "=== colors.button ==="
for key in primaryBackground primaryText secondaryBackground secondaryText cancelBackground dangerHover destructiveHover disabledBackground disabledBackgroundEnd disabledText disabledOpacity inactiveBackground; do
  count_usage "colors.button.$key"
done

echo "=== colors.passwordStrength ==="
for key in weak medium strong; do
  count_usage "colors.passwordStrength.$key"
done

echo "=== colors.step ==="
for key in active inactive; do
  count_usage "colors.step.$key"
done

echo "=== colors.tabBar ==="
for key in active inactive; do
  count_usage "colors.tabBar.$key"
done

echo "=== colors.interactive ==="
for key in surface hoverSubtle hoverStrong hoverMedium highlight; do
  count_usage "colors.interactive.$key"
done

echo "=== colors.overlay ==="
for key in dark darkHover; do
  count_usage "colors.overlay.$key"
done

echo "=== colors.skeleton ==="
for key in base highlight; do
  count_usage "colors.skeleton.$key"
done

echo "=== colors.dialog ==="
for key in overlay background border; do
  count_usage "colors.dialog.$key"
done

echo "=== colors.card ==="
for key in background border borderActive; do
  count_usage "colors.card.$key"
done

echo "=== colors.sheet ==="
for key in backdrop handle; do
  count_usage "colors.sheet.$key"
done

echo "=== colors.scanner ==="
for key in background surface text textSecondary textTertiary button; do
  count_usage "colors.scanner.$key"
done

echo "=== colors.palette ==="
for key in orange green purple amber blue pink cyan indigo; do
  count_usage "colors.palette.$key"
done

echo "=== colors.verified ==="
for key in background icon; do
  count_usage "colors.verified.$key"
done

echo "=== colors.blockchain ==="
for key in solana solanaDevnet solanaTestnet bitcoin bitcoinTestnet bitcoinSignet ethereum ethereumSepolia ethereumHolesky; do
  count_usage "colors.blockchain.$key"
done

echo ""
echo "============================================"
echo "  GRADIENT TOKEN USAGE"
echo "============================================"
echo ""

echo "=== gradients (RN objects) ==="
for key in primary primaryButton balanceCard balanceCardSolana balanceCardSolanaDevnet balanceCardSolanaTestnet balanceCardBitcoin balanceCardBitcoinTestnet balanceCardBitcoinRegtest balanceCardEthereum balanceCardEthereumSepolia balanceCardEthereumGoerli disabled onboarding tabBarFade glassyBorder; do
  count_usage "gradients.$key"
done

echo "=== gradients (CSS strings) ==="
for key in primaryCSS primaryButtonCSS balanceCardCSS disabledCSS balanceCardSolanaCSS balanceCardSolanaDevnetCSS balanceCardBitcoinCSS balanceCardBitcoinTestnetCSS balanceCardEthereumCSS balanceCardEthereumSepoliaCSS; do
  count_usage "gradients.$key"
done

echo "=== getScalesColorForBlockchain ==="
count_usage "getScalesColorForBlockchain"
