/**
 * Duration tokens for Salmon Wallet
 * Consistent timing values for transitions, animations, and feedback delays
 * Works for both React Native (Expo) and Web (WXT+Vite extension)
 */

/**
 * Transition duration tokens (CSS string format)
 */
export const duration = {
  /** 100ms - Micro-interactions (transform on press) */
  fastest: '100ms',
  /** 150ms - Quick feedback (opacity on press) */
  fast: '150ms',
  /** 200ms - Standard UI transitions (hover, border, background, opacity) */
  normal: '200ms',
  /** 250ms - Medium transitions (slide, color change) */
  medium: '250ms',
  /** 300ms - Slow transitions (expand/collapse, drawer close) */
  slow: '300ms',
  /** 400ms - Entrance animations (scale-in, fade-in-out) */
  slower: '400ms',
  /** 500ms - Debounce / stagger delay base */
  stagger1: '500ms',
  /** 550ms - Stagger delay 2 */
  stagger2: '550ms',
  /** 600ms - Stagger delay 3 */
  stagger3: '600ms',
} as const;

/**
 * Numeric duration tokens (milliseconds)
 * Used in setTimeout, setInterval, and JS animation APIs
 */
export const durationMs = {
  /** 200ms */
  normal: 200,
  /** 250ms */
  medium: 250,
  /** 300ms */
  slow: 300,
  /** 400ms */
  slower: 400,
  /** 500ms - Debounce delay */
  debounce: 500,
  /** 1000ms - Continuous spin animation cycle */
  spin: 1000,
  /** 1200ms - Pulse animation cycle */
  pulse: 1200,
  /** 1500ms - Short feedback display (copy confirmation) */
  feedbackShort: 1500,
  /** 1500ms - Shimmer/skeleton animation cycle */
  shimmer: 1500,
  /** 2000ms - Long feedback display */
  feedbackLong: 2000,
  /** 2000ms - Slow spin animation cycle */
  spinSlow: 2000,
} as const;

/**
 * Common easing functions
 */
export const easing = {
  /** Standard ease for most transitions */
  ease: 'ease',
  /** Ease-out for entrances */
  easeOut: 'ease-out',
  /** Ease-in for exits */
  easeIn: 'ease-in',
  /** Ease-in-out for symmetric animations */
  easeInOut: 'ease-in-out',
  /** Material Design standard curve */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Smooth slide curve */
  slide: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** Bouncy entrance */
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type Duration = typeof duration;
export type DurationMs = typeof durationMs;
export type Easing = typeof easing;
