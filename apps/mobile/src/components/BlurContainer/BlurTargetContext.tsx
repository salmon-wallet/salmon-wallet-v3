import { createContext, useContext, type RefObject } from 'react';
import type { View } from 'react-native';

const BlurTargetContext = createContext<RefObject<View | null> | undefined>(undefined);

export const BlurTargetProvider = BlurTargetContext.Provider;

export function useBlurTarget(): RefObject<View | null> | undefined {
  return useContext(BlurTargetContext);
}
