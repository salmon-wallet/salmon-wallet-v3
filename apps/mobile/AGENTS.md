# AGENTS.md instructions for `apps/mobile`

## Responsibility

- React Native app implementation
- mobile-only UI flows
- native/runtime-specific integrations

## Rules

- Keep mobile-only UI and runtime behavior here.
- Reuse `packages/shared` contracts instead of duplicating business logic locally.
- Do not import DOM-only UI from `packages/ui`.

## Testing

- Add or update mobile tests when RN behavior or mobile-only flows change.
- Mobile end-to-end UI tests live in `.maestro/` (Maestro flows against
  the iOS Simulator or Android emulator with the Expo dev build
  installed). See `.maestro/README.md` for setup and `.maestro/AGENTS.md`
  for conventions agents must follow when extending the suite.
