export const DESIGN_WIDTH = 440;
export const DESIGN_HEIGHT = 956;

export interface ScalingDimensions {
  width: number;
  height: number;
}

export function getNativeScalingDimensions(
  width: number,
  height: number
): ScalingDimensions {
  const portraitWidth = Math.min(width, height);
  const portraitHeight = Math.max(width, height);

  return {
    width: Math.min(portraitWidth, DESIGN_WIDTH),
    height: Math.min(portraitHeight, DESIGN_HEIGHT),
  };
}
