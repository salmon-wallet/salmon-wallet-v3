export const TABLET_MIN_SHORT_SIDE = 600;

const PHONE_HORIZONTAL_PADDING = 0;
const TABLET_HORIZONTAL_PADDING = 32;
const TABLET_CONTENT_MAX_WIDTH = 760;
const TABLET_WIDE_CONTENT_MAX_WIDTH = 1120;
const TABLET_TAB_BAR_MAX_WIDTH = 640;
const TABLET_BOTTOM_SHEET_MAX_WIDTH = 640;
const TABLET_QR_MAX_SIZE = 480;
const PHONE_QR_MAX_SIZE = 420;

export type MobileDeviceClass = 'phone' | 'tablet';
export type MobileOrientation = 'portrait' | 'landscape';

export interface ResponsiveLayout {
  width: number;
  height: number;
  shortSide: number;
  longSide: number;
  deviceClass: MobileDeviceClass;
  orientation: MobileOrientation;
  isTablet: boolean;
  isLandscape: boolean;
  horizontalPagePadding: number;
  contentMaxWidth: number;
  wideContentMaxWidth: number;
  tabBarMaxWidth: number;
  bottomSheetMaxWidth: number;
  nftColumns: number;
  qrSize: number;
}

export function getGridItemWidth(
  containerWidth: number,
  columns: number,
  gap: number,
  horizontalPadding: number
): number {
  const availableWidth =
    containerWidth - horizontalPadding * 2 - gap * (columns - 1);

  return Math.floor(availableWidth / columns);
}

export function getResponsiveLayout(
  width: number,
  height: number
): ResponsiveLayout {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isTablet = shortSide >= TABLET_MIN_SHORT_SIDE;
  const isLandscape = width > height;
  const horizontalPagePadding = isTablet
    ? TABLET_HORIZONTAL_PADDING
    : PHONE_HORIZONTAL_PADDING;
  const availableWidth = Math.max(0, width - horizontalPagePadding * 2);
  const contentMaxWidth = isTablet
    ? Math.min(TABLET_CONTENT_MAX_WIDTH, availableWidth)
    : width;
  const wideContentMaxWidth = isTablet
    ? Math.min(TABLET_WIDE_CONTENT_MAX_WIDTH, availableWidth)
    : width;
  const tabBarMaxWidth = isTablet
    ? Math.min(TABLET_TAB_BAR_MAX_WIDTH, availableWidth)
    : width;
  const bottomSheetMaxWidth = isTablet
    ? Math.min(TABLET_BOTTOM_SHEET_MAX_WIDTH, availableWidth)
    : width;
  const nftColumns = isTablet ? (width >= 1200 ? 4 : 3) : 2;
  const qrHorizontalLimit = bottomSheetMaxWidth - 48;
  const qrVerticalLimit = height * (isTablet ? 0.48 : 0.52);
  const qrSize = Math.floor(
    Math.min(
      qrHorizontalLimit,
      qrVerticalLimit,
      isTablet ? TABLET_QR_MAX_SIZE : PHONE_QR_MAX_SIZE
    )
  );

  return {
    width,
    height,
    shortSide,
    longSide,
    deviceClass: isTablet ? 'tablet' : 'phone',
    orientation: isLandscape ? 'landscape' : 'portrait',
    isTablet,
    isLandscape,
    horizontalPagePadding,
    contentMaxWidth,
    wideContentMaxWidth,
    tabBarMaxWidth,
    bottomSheetMaxWidth,
    nftColumns,
    qrSize,
  };
}
