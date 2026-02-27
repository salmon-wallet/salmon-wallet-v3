import { browser } from 'wxt/browser';

/**
 * Compatible session storage area.
 * Uses storage.session (MV3) when available, falls back to storage.local (MV2).
 */
export const sessionArea = browser.storage.session ?? browser.storage.local;
