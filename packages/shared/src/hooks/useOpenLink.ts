/**
 * useOpenLink - Hook for opening external URLs
 *
 * Provides a callback function to safely open URLs in the system browser.
 * Handles validation and error cases.
 *
 * Used by settings screens (about.tsx, support.tsx) to open external links.
 */

import { useCallback } from 'react';
import { Linking } from 'react-native';

/**
 * Hook that returns a function to open external URLs
 *
 * @returns A callback function that takes a URL string and attempts to open it
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const openLink = useOpenLink();
 *
 *   return (
 *     <TouchableOpacity onPress={() => openLink('https://example.com')}>
 *       <Text>Open Link</Text>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */
export function useOpenLink() {
  return useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  }, []);
}
