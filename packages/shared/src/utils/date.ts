/**
 * Date and Time Formatting Utilities
 *
 * Provides formatting functions for displaying timestamps, dates,
 * and block numbers in the UI.
 */

import { formatDistanceToNow, format, fromUnixTime } from 'date-fns';

// ============================================================================
// Relative Time Formatting
// ============================================================================

/**
 * Format a Unix timestamp as relative time (e.g., "2h ago", "3 days ago")
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted relative time string
 *
 * @example
 * ```typescript
 * formatRelativeTime(Date.now() / 1000 - 3600)    // 'about 1 hour ago'
 * formatRelativeTime(Date.now() / 1000 - 86400)   // '1 day ago'
 * formatRelativeTime(Date.now() / 1000 - 60)      // '1 minute ago'
 * ```
 */
export function formatRelativeTime(timestamp: number): string {
  const date = fromUnixTime(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a Unix timestamp as a readable date (e.g., "Jan 15, 2024")
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(1705276800)  // 'Jan 15, 2024'
 * formatDate(1609459200)  // 'Jan 1, 2021'
 * ```
 */
export function formatDate(timestamp: number): string {
  const date = fromUnixTime(timestamp);
  return format(date, 'MMM d, yyyy');
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format a Unix timestamp as a readable time (e.g., "14:30")
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted time string in 24-hour format
 *
 * @example
 * ```typescript
 * formatTime(1705327800)  // '14:30'
 * formatTime(1705284000)  // '02:00'
 * ```
 */
export function formatTime(timestamp: number): string {
  const date = fromUnixTime(timestamp);
  return format(date, 'HH:mm');
}

// ============================================================================
// DateTime Formatting
// ============================================================================

/**
 * Format a Unix timestamp as full datetime (e.g., "Jan 15, 2024 at 14:30")
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted datetime string
 *
 * @example
 * ```typescript
 * formatDateTime(1705327800)  // 'Jan 15, 2024 at 14:30'
 * formatDateTime(1609502400)  // 'Jan 1, 2021 at 12:00'
 * ```
 */
export function formatDateTime(timestamp: number): string {
  const date = fromUnixTime(timestamp);
  return format(date, "MMM d, yyyy 'at' HH:mm");
}

// ============================================================================
// Block Number Formatting
// ============================================================================

/**
 * Format block/slot number with thousands separators
 *
 * @param slot - Block or slot number
 * @returns Formatted string with thousands separators
 *
 * @example
 * ```typescript
 * formatBlockNumber(123456789)  // '123,456,789'
 * formatBlockNumber(1000)       // '1,000'
 * formatBlockNumber(42)         // '42'
 * ```
 */
export function formatBlockNumber(slot: number): string {
  return slot.toLocaleString('en-US');
}
