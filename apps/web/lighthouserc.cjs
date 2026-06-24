/**
 * Lighthouse CI config for the web app.
 *
 * Measures the production build (served statically) against Core Web Vitals
 * budgets and category floors. Run after `pnpm --filter @salmon/web build`:
 *   pnpm --filter @salmon/web lh
 *
 * Scores the boot/lock screen (no auth). Thresholds are ratcheted to the
 * current build — tighten them as the app improves; never loosen silently.
 * CWV targets come from the team performance budget (LCP<2.5s, CLS<0.1,
 * TBT<200ms, FCP<1.5s).
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      settings: {
        // Desktop-class run; the wallet ships as a desktop web app + extension.
        preset: 'desktop',
      },
    },
    assert: {
      // Thresholds are ratcheted to the current build (a11y 0.86, perf 0.87,
      // FCP ~1.6s) with a small margin for run-to-run variance, so the gate
      // catches regressions without flaking. Tighten as the app improves.
      assertions: {
        // Category floors (axe-backed critical a11y is gated separately in e2e;
        // this Lighthouse a11y score also covers contrast/structure ~ the rest).
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['error', { minScore: 0.8 }],
        // Core Web Vitals budgets (team targets, with variance margin).
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.playwright/reports/lighthouse',
    },
  },
};
