# AGENTS.md instructions for `packages/shared/src/hooks`

## Responsibility

- shared hooks and orchestration used by multiple apps

## Rules

- Keep hooks cross-platform unless there is an explicit shim pattern.
- Move browser-only or native-only behavior out to app-local code or platform-specific files.
- Keep UI concerns out of hooks when the logic is reusable without presentation.

## Testing

- Add or update hook tests when shared behavior, branching, or contracts change.
