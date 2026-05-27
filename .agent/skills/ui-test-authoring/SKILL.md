---
name: ui-test-authoring
description: "Write or audit tests for shared React DOM components in packages/ui. Use this skill when a packages/ui component is created or changed and needs render or interaction coverage, when reviewing missing UI test coverage, or when deciding whether a shared DOM component should stay test-light. Use together with salmon-repo-rules when the change also affects placement, shared contracts, or public exports."
---

`packages/ui` uses Vitest scripts, but it has little established test corpus. Keep tests narrow, explicit, and tied to public behavior.

## Workflow

1. Read `salmon-repo-rules` first if the change also touches ownership, contracts, or export paths.
2. Identify the component's public behavior and the risk introduced by the change.
3. Read [references/test-rules.md](references/test-rules.md).
4. Decide whether this is an audit-only task, render coverage, interaction coverage, or both.
5. Write a co-located `Component.test.tsx` file with file-level jsdom when DOM rendering is required.
6. Run `pnpm --filter @salmon/ui test`.

## Clarification gate

Ask 1-3 focused questions if any of these are unclear:

- What behavior is most important to protect?
- Does the user want render coverage only, interaction coverage, or both?
- Is the component simple enough that broad testing is unnecessary?
- Did the change alter a public contract, state transition, or user-visible behavior?
- Is changing or adding package-local test setup also in scope?

Do not guess the desired test depth if it affects scope.

## Rules

- Focus on observable behavior, not implementation details.
- Prefer user-facing assertions with `@testing-library/react`.
- Use `@vitest-environment jsdom` at file top for DOM rendering tests.
- Use the component's shared contract and token-driven behavior as test design inputs.
- Keep setup local to the test file unless the repo already has a shared helper.
- Treat snapshots as opt-in, not as the default.

## Audit mode

When asked to audit UI test coverage, check for:

- Shared components with significant behavior that have no tests
- Components with complex state transitions or conditional rendering that lack interaction tests
- Tests that assert implementation details (class names, internal state) instead of user-visible behavior
- Missing tests for components that were recently modified or created
- Test files that don't clean up mocks between tests (state leaking)

Report findings as a prioritized list: high-risk untested components first.

## What this skill should produce

- Tests aligned with the component's public behavior and risk level.
- A clarified scope when the desired test depth was initially ambiguous.
- An audit report when asked to review UI test coverage.
- Questions first when the testing strategy is not fully specified.
