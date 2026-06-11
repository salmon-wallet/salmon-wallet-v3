import {
  getGridItemWidth,
  getResponsiveLayout,
  TABLET_MIN_SHORT_SIDE,
} from './responsiveLayout';

describe('getResponsiveLayout', () => {
  it('uses compact phone metrics for a portrait phone', () => {
    expect(getResponsiveLayout(390, 844)).toMatchObject({
      deviceClass: 'phone',
      orientation: 'portrait',
      contentMaxWidth: 390,
      tabBarMaxWidth: 390,
      nftColumns: 2,
    });
  });

  it('uses tablet metrics at the shortest-side threshold', () => {
    const layout = getResponsiveLayout(1024, TABLET_MIN_SHORT_SIDE);

    expect(layout).toMatchObject({
      deviceClass: 'tablet',
      orientation: 'landscape',
      contentMaxWidth: 760,
      wideContentMaxWidth: 960,
      tabBarMaxWidth: 640,
      bottomSheetMaxWidth: 640,
      nftColumns: 3,
    });
  });

  it('uses four NFT columns on a wide 10-inch tablet', () => {
    expect(getResponsiveLayout(1280, 800).nftColumns).toBe(4);
  });

  it('limits QR size by available height as well as width', () => {
    expect(getResponsiveLayout(1024, 600).qrSize).toBeLessThanOrEqual(288);
    expect(getResponsiveLayout(1280, 800).qrSize).toBeLessThanOrEqual(384);
  });

  it('calculates fixed grid item width without stretching incomplete rows', () => {
    expect(getGridItemWidth(960, 3, 18, 18)).toBe(296);
  });
});
