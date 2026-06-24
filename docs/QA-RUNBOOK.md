# QA Runbook — Salmon Wallet v3

Baseline quality checks every change should clear before it ships, how to run
each one, and what is and isn't covered today. This is a **state-of-reality**
document: it marks what is automated, what is manual, and the known debt — it
does not promise coverage that isn't there.

Scope: the monorepo's three runtimes — `apps/web` (React + MUI), `apps/extension`
(wxt + MUI), `apps/mobile` (React Native / Expo) — plus the shared packages
(`packages/shared`, `packages/ui`). The backend lives in the sibling repo
`../salmon-api` and runs in Docker.

---

## TL;DR — pre-release gate

Run from the repo root. All of these must be green before merging:

```bash
# 1. Types (all packages)
pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui \
  --filter=@salmon/web --filter=@salmon/extension --filter=@salmon/mobile

# 2. Unit / component tests
pnpm --filter @salmon/shared test          # vitest
pnpm --filter @salmon/ui test              # vitest
pnpm --filter @salmon/mobile test          # jest

# 3. i18n key parity (en/es in sync)
pnpm --filter @salmon/shared i18n:check
```

The e2e suites and Lighthouse below need the backend up and are run per-surface
(see each section). They **skip** when `../salmon-api` is unreachable, so they
never fail a machine that simply doesn't have the backend running — but a
reachable backend with wrong behaviour **does** fail them.

---

## Coverage matrix

| Dimension | web | extension | mobile | How |
|---|---|---|---|---|
| Types | ✅ | ✅ | ✅ | `turbo typecheck` |
| Unit / component | — (shared/ui) | — | ✅ jest | vitest / jest |
| Functional e2e | ✅ Playwright | ✅ Playwright | ✅ Maestro | per-suite |
| Accessibility (automated) | ✅ axe + Lighthouse | ✅ axe | 🟡 a11y props only | axe critical gate |
| Performance / CWV | ✅ Lighthouse | ❌ (popup, N/A) | ❌ | `lh` |
| Cross-browser | ✅ chromium+firefox+webkit | chromium only | n/a | Playwright projects |
| Responsive | ✅ breakpoint overflow | n/a (fixed popup) | 🟡 single simulator | `responsive.spec` |
| i18n parity | ✅ | ✅ | ✅ (shared locales) | `i18n:check` |

✅ automated · 🟡 partial / manual · ❌ not covered (see Known gaps).

---

## Environment & prerequisites

- **Backend**: `../salmon-api` in Docker, reachable at `http://127.0.0.1:3001`
  (a `404` on `/` means it's alive). e2e/Lighthouse skip if it's down.
- **Playwright browsers** (web cross-browser + extension):
  `pnpm exec playwright install chromium firefox webkit`
- **Test secrets**: each Playwright suite reads a gitignored `<suite>/.env.test`
  (see `<suite>/.env.test.example` for the keys — typically
  `SALMON_TEST_PASSWORD` + `SALMON_TEST_SEED_A`/`SEED_B`). Never commit real
  values; the password must be 12+ chars.
- **Mobile**: a booted iOS Simulator / Android emulator with the Expo dev build
  installed. Run Maestro from `apps/mobile/.maestro/` (its `takeScreenshot`
  paths are cwd-relative — see `apps/mobile/.maestro/AGENTS.md`).

---

## Running each check

### Web e2e (functional + a11y + responsive, all browsers)

```bash
pnpm --filter @salmon/web e2e          # starts the vite dev server itself
```

Specs in `apps/web/.playwright/tests/`: `smoke` (boot + lock contract), `a11y`
(axe on the boot screen), `responsive` (no horizontal overflow at
375/768/1024/1440, chromium only). Every spec runs on chromium, firefox and
webkit via the `projects` in `playwright.config.ts`.

### Extension e2e (functional + a11y)

```bash
pnpm --filter @salmon/extension build  # data-testids ship in the bundle — rebuild first
pnpm --filter @salmon/extension e2e
```

Specs in `apps/extension/.playwright/tests/`: `lock`, `receive`, `send`,
`activity`, `settings` (open → read-only panels → close, never touches
secret-reveal or destructive actions), and `a11y` (axe on home, the receive
sheet and the settings drawer). If a run hangs,
`rm -rf apps/extension/.playwright/profiles` forces a clean recover.

### Mobile e2e (Maestro)

```bash
cd apps/mobile/.maestro
maestro test flows/smoke/...           # or flows/actions/...
```

Flows select by `id:` (React Native `testID`) — immune to copy/i18n. Secret /
destructive flows (`flows/actions/reveal/*`, `flows/actions/reset/*`) exist for
id coverage; do not run them casually.

### Lighthouse (performance + a11y + SEO + best-practices budgets)

```bash
pnpm --filter @salmon/web build
pnpm --filter @salmon/web lh
```

`lighthouserc.cjs` serves the **production build** through `vite preview` (SPA
fallback) and runs Lighthouse 3× against the welcome screen, asserting:

| Category / metric | Threshold | Current |
|---|---|---|
| Accessibility | ≥ 0.95 | **1.00** |
| Best Practices | ≥ 0.95 | **1.00** |
| SEO | ≥ 0.95 | **1.00** |
| Performance | ≥ 0.80 | 0.84 |
| LCP | ≤ 2.5 s | ~1.8 s |
| CLS | ≤ 0.1 | ok |
| TBT | ≤ 300 ms | ok |
| FCP | ≤ 1.5 s (warn) | ~1.8 s |

> Note: serve via `vite preview`, **not** a bare static dir — a static dir 404s
> client routes and Lighthouse ends up scoring the React Router error page.

Thresholds are ratcheted to the current build with variance headroom. Tighten
as the app improves; never loosen silently.

---

## Accessibility

Two automated layers plus manual checks:

- **axe-core critical gate** (e2e): `a11y.spec.ts` (web + extension) fails only
  on `critical` violations and attaches the full violation list for triage.
  Automated axe catches ~30–40 % of WCAG — it complements, never replaces,
  manual keyboard + screen-reader passes.
- **Lighthouse a11y** (contrast/structure) as a category floor (≥0.95).
- **Authoring**: every interactive element carries a stable `testID` /
  `data-testid` plus semantics (`accessibilityRole`/`aria-label`,
  `accessibilityState`). See the `e2e-test-labels` skill
  (`.agent/skills/e2e-test-labels/SKILL.md`) for the selector + a11y contract.

Manual, per release: keyboard navigation of the main flows, reduced-motion
behaviour, and a screen-reader spot check of auth + send.

---

## Selector / test-label contract

One canonical kebab-case id per logical element, identical across platforms
(RN `testID`, DOM `data-testid`, Maestro `id:`). Lists are parametrized
(`token-row-${symbol}`, `settings-item-${slug}`). Canonical ids are immutable
once flows depend on them — renaming is a breaking change to the suites. Full
rules: `.agent/skills/e2e-test-labels/SKILL.md`.

MUI v7 caveat: `Switch` ignores `inputProps`; pass `data-testid`/`aria-label`
via `slotProps={{ input: {...} }}`. `InputBase`/`TextField` still take
`inputProps={{ 'data-testid': ... }}`.

---

## i18n

`pnpm --filter @salmon/shared i18n:check` flattens `en`/`es` for the shared
translations and the extension `_locales` and fails on any key the reference
locale has but a translation is missing. Currently in sync. Add it to CI before
any release that touches copy.

---

## Known gaps & debt

- **Web boot bundle**: ~4.5 MB (1.7 MB gzip) in a single chunk; Lighthouse
  performance is 0.84 and FCP/LCP ~1.8 s. Routes are already lazy-loaded; the
  weight is the eagerly-imported Solana/Bitcoin/web3 vendor code. `manualChunks`
  vendor-splitting was tried and reverted — splitting those CJS/polyfill deps
  breaks module init order (a known Vite issue) and only helps caching, not
  first paint. The real lever (deferring the heavy crypto/web3 libs off the boot
  path) is open.
- **Web a11y/responsive depth**: automated coverage is the boot/welcome screen
  plus the home overflow check; authenticated screens beyond home are not yet
  axe/responsive-scanned on web.
- **Cross-browser**: extension e2e is chromium-only (extensions load via a
  persistent chromium context); only the web suite is multi-engine. Firefox
  needs its browser binary (`playwright install firefox`).
- **No visual-regression baselines** and **mobile runs on a single simulator
  size** — UI-shape regressions across devices are caught manually today.
- **Lighthouse/i18n are local commands**, not yet wired into CI gating.

---

## Deploy & rollback (summary)

- **Web**: pushed to S3 + CloudFront via the `deploy-web.yml` workflow (OIDC).
  Rollback = redeploy the previous build; the bucket has versioning on.
- **Extension**: `build-extension.yml` (manual `workflow_dispatch`) produces
  chrome/firefox artifacts + a source bundle; no auto-publish.
- **Mobile**: EAS build (`pnpm build:aab` / `build:apk` from `apps/mobile`) —
  see `apps/mobile/AGENTS.md` for the pre-build checklist and keystore rules.

Post-deploy, watch error tracking + uptime; keep the previous build deployable
for a fast revert.
