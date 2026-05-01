# AGENTS.md instructions for `apps/web`

## Responsibility

- web app shell
- routing, providers, and browser-specific wiring

## Rules

- Keep browser-only concerns here.
- Reuse `packages/shared` for logic and `packages/ui` for shared DOM components.
- Avoid re-implementing shared services or contracts locally.

## Testing

- Add or update web tests when web-only routing or browser-specific behavior changes.
