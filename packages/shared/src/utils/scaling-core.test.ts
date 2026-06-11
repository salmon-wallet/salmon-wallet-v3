import { describe, expect, it } from 'vitest';

import { getNativeScalingDimensions } from './scaling-core';

describe('getNativeScalingDimensions', () => {
  it('preserves phone dimensions below the design canvas', () => {
    expect(getNativeScalingDimensions(375, 812)).toEqual({
      width: 375,
      height: 812,
    });
  });

  it('normalizes landscape dimensions before scaling', () => {
    expect(getNativeScalingDimensions(812, 375)).toEqual({
      width: 375,
      height: 812,
    });
  });

  it('caps tablet dimensions at the phone design canvas', () => {
    expect(getNativeScalingDimensions(1280, 800)).toEqual({
      width: 440,
      height: 956,
    });
  });
});
