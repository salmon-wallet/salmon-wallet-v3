#!/bin/bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPACING_FILE="packages/shared/src/theme/spacing.ts"

count_usage() {
  local token="$1"
  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' -F "$token" "$ROOT" \
    | grep -v "node_modules" \
    | grep -v "$SPACING_FILE" \
    | grep -v "audit-spacing.sh" \
    | grep -v ".turbo")
  local count
  count=$(echo "$results" | grep -c . 2>/dev/null || echo "0")
  if [ "$count" -eq 0 ] || [ -z "$results" ]; then
    echo "  [$token] -> 0 uses  *** UNUSED ***"
  else
    echo "  [$token] -> $count uses"
  fi
}

echo "=== spacing ==="
for key in none '2xs' xxs xs tokenAmountGap sm base md lg headerPadding xl '2xl' '3.5xl' '3xl' '4xl' paginationGap '5xl' '5.5xl' '6xl' '7xl' '8xl'; do
  count_usage "spacing.$key"
done

echo ""
echo "=== borderRadius ==="
for key in none scrollbar sm md lg button xl iconContainer iconLg tokenIcon '2xl' badge '3xl' header card full; do
  count_usage "borderRadius.$key"
done

echo ""
echo "=== componentSizes ==="
for key in buttonHeight buttonHeightMedium buttonHeightSmall buttonHeightCompact buttonRadius buttonRadiusSmall \
  actionButtonWidth actionButtonHeight actionButtonRadius actionButtonIcon \
  inputHeight inputHeightLg inputRadius \
  logoSizeLarge logoSizeMedium logoSizeSmall \
  stepDotSize stepDotGap checkboxSize \
  iconSizeXxs iconSizeXxsm iconSizeXs iconSizeXSmall iconSizeSmall iconSizeCompact iconSizeMedium iconSizeMButton iconSizeLarge iconSizeXL iconSize2XL iconSize3XL iconSize4XL iconSize5XL iconSize6XL tokenIconXL \
  headerHeight headerButtonSize backButtonSize \
  logoContainer blockchainIcon eyeIcon changeArrowIcon \
  headerInnerHeight cardHeaderOffset \
  tabBarPaddingTop tabBarContentHeight tabBarMinBottomPadding tabBarHeight tabBarScrollPadding \
  tokenIcon \
  sheetHandleWidth sheetHandleHeight sheetHandleOpacity sheetFadeGradientHeight \
  qrBorderWidth receiveContentGap copyButtonWidth \
  scrollbarWidthSm scrollbarWidth dividerHeight backgroundPatternHeight \
  nftBadgeHeight nftCardGap \
  skeletonBadgeWidth shimmerOffset shimmerWidth skeletonBalanceWidth \
  buttonMinWidth buttonMinWidthLg \
  swapSelectorMinWidth swapReviewCardMinHeight \
  badgeMinWidth tokenIconSm chartHeight \
  webContainerMaxWidth nftImageMaxWidth qrCodeSize drawerWidth \
  dialogWidthSm sheetWidthSm sheetWidthMd sheetWidthBase sheetWidthLg sheetWidthXl \
  sheetMaxHeight breakpointDesktop; do
  count_usage "componentSizes.$key"
done

echo ""
echo "=== contentPadding ==="
for key in screen card modal; do
  count_usage "contentPadding.$key"
done

echo ""
echo "=== borderWidth ==="
for key in none actionButton tokenListItem thin header accent medium heavy thick sheet; do
  count_usage "borderWidth.$key"
done

echo ""
echo "=== opacity ==="
for key in none faint disabled low medium high soft full; do
  count_usage "opacity.$key"
done

echo ""
echo "=== blur ==="
for key in xs sm md lg; do
  count_usage "blur.$key"
done
