# Playwright web test suite

Stub. Populate when work on the web e2e tests begins.

## Intended layout (mirrors `apps/extension/.playwright/`)

| Path | Purpose |
|---|---|
| `scripts/` | Runnable `.mjs` scripts + shared `lib.mjs` |
| `scripts/lib.mjs` | Shared launch + secrets helpers |
| `fixtures/` | Per-test artifacts (gitignored) |
| `reports/` | Markdown reports written by scripts (gitignored) |
| `profiles/` | Persistent Chromium profile if needed (gitignored) |
| `.env.test` | Secrets (gitignored). Copy from `.env.test.example` |

## Differences from the extension suite

- **Target**: web app served by `pnpm --filter @salmon/web dev` (e.g.
  `http://localhost:5173/`), not the extension popup.
- **No extension load**. Drop the `--load-extension` chromium flags.
- **No persistent wallet recovery**. Web app delegates to the extension
  (or future web-only auth) — set up auth via the API or test fixtures.

## Reference

The extension suite at `apps/extension/.playwright/README.md` is the
canonical pattern. Reuse the helpers shape (launch, capture, tapConsole,
waitForButtonEnabled) but point Chromium at the dev server instead of the
extension dist.
