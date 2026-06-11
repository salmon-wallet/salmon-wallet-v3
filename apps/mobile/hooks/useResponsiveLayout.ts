import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  getResponsiveLayout,
  type ResponsiveLayout,
} from './responsiveLayout';

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => getResponsiveLayout(width, height),
    [height, width]
  );
}

export default useResponsiveLayout;
