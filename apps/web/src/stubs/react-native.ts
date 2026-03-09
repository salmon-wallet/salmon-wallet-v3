/**
 * Stub for react-native in web environment.
 *
 * Provides web-compatible implementations of react-native APIs
 * that are imported transitively via @salmon/shared.
 */

export const Dimensions = {
  get(_dim: 'window' | 'screen') {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 500, height: 900 };
  },
};

export const Platform = {
  OS: 'web' as const,
  select: <T>(obj: { web?: T; default?: T }) => obj.web ?? obj.default,
};

export const Linking = {
  openURL: (url: string) => window.open(url, '_blank'),
  getInitialURL: () => Promise.resolve(null),
};

export default {
  Dimensions,
  Platform,
  Linking,
};
