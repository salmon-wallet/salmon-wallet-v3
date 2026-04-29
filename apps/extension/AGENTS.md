# AGENTS.md instructions for `apps/extension`

## Responsibility

- extension entrypoints
- extension pages and sheets
- browser-extension-specific integrations

## Rules

- Keep extension runtime code here.
- Reuse `packages/shared` for logic and `packages/ui` for shared DOM components when applicable.
- Keep browser-extension specifics out of shared packages unless there is an explicit compatibility layer.

## Testing

- Add or update extension tests when extension-specific behavior or entrypoint contracts change.
- Browser-extension end-to-end tests live in `.playwright/` (Playwright +
  bundled chromium with the built extension loaded). See
  `.playwright/README.md` for setup and `.playwright/AGENTS.md` for
  conventions agents must follow when extending the suite.
