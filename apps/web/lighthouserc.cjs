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
      // Serve the built app through `vite preview` (SPA history-fallback) rather
      // than a bare static dir — the latter 404s client routes and renders the
      // React Router error boundary, which would score a blank error page.
      startServerCommand: 'pnpm preview --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        // Desktop-class run; the wallet ships as a desktop web app + extension.
        preset: 'desktop',
      },
    },
    assert: {
      // Ratcheted to the real welcome screen (a11y/best-practices/SEO = 100,
      // performance = 84). The first three are locked near-perfect; performance
      // is load-bound by the JS bundle (see known debt) so it gets a floor with
      // headroom. Tighten as the bundle shrinks; never loosen silently.
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
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
