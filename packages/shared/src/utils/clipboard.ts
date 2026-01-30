/**
 * Clipboard utilities for web platform.
 * Uses the navigator.clipboard API for secure clipboard operations.
 *
 * Note: This is the web version. For React Native/Expo, use expo-clipboard instead.
 */

/**
 * Copies the given text to the system clipboard.
 *
 * @param text - The text string to copy to clipboard
 * @returns Promise that resolves to true if successful, false if failed
 *
 * @example
 * ```typescript
 * const success = await copyToClipboard('Hello World');
 * if (success) {
 *   console.log('Text copied successfully');
 * } else {
 *   console.log('Failed to copy text');
 * }
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator?.clipboard?.writeText) {
      console.warn('Clipboard API not available');
      return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Reads text from the system clipboard.
 *
 * @returns Promise that resolves to the clipboard text content, or null if failed
 *
 * @example
 * ```typescript
 * const text = await pasteFromClipboard();
 * if (text !== null) {
 *   console.log('Clipboard content:', text);
 * } else {
 *   console.log('Failed to read clipboard');
 * }
 * ```
 *
 * @remarks
 * Note: Reading from clipboard may require user permission in some browsers.
 * The browser may prompt the user to grant clipboard read access.
 */
export async function pasteFromClipboard(): Promise<string | null> {
  try {
    if (!navigator?.clipboard?.readText) {
      console.warn('Clipboard API not available');
      return null;
    }

    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
}
