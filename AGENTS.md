# AGENTS.md instructions for salmon-wallet-v3

<INSTRUCTIONS>
## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used in this workspace. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.

### Available skills
- api-service-authoring: Create or modify shared API services in `packages/shared/src/api/services`, including caching, rate limiting, DI adapters, and service audits. Use for new endpoints, API integrations, shared HTTP/data-fetching logic, or service consistency reviews. (file: .agent/skills/api-service-authoring/SKILL.md)
- i18n-authoring: Add, update, remove, or audit user-facing translations in Salmon Wallet. Use whenever visible copy changes, new translation keys are needed, or hardcoded UI strings must be replaced with i18n. (file: .agent/skills/i18n-authoring/SKILL.md)
- mobile-component-scaffold: Create or modify React Native components in `apps/mobile`, including app-local mobile UI and mobile implementations of shared semantic contracts. Use only when the task explicitly targets `apps/mobile`, React Native, Expo, native UI files, or mobile implementation work. (file: .agent/skills/mobile-component-scaffold/SKILL.md)
- mobile-test-authoring: Write or audit Jest tests for React Native components and mobile UI behavior in `apps/mobile`. Use only when the task explicitly targets `apps/mobile`, React Native, Expo, or RN-specific test work. (file: .agent/skills/mobile-test-authoring/SKILL.md)
- salmon-repo-rules: Resolve code placement, package ownership, shared-vs-app boundaries, public exports, and architectural conventions in the Salmon Wallet monorepo. (file: .agent/skills/salmon-repo-rules/SKILL.md)
- shared-test-authoring: Write or update tests for code in `packages/shared`, including hooks, API services, utilities, blockchain logic, crypto, and config. (file: .agent/skills/shared-test-authoring/SKILL.md)
- ui-component-scaffold: Create or modify shared React DOM components in `packages/ui`, including DOM-only components and cross-platform contract + DOM implementation flows. (file: .agent/skills/ui-component-scaffold/SKILL.md)
- ui-test-authoring: Write or audit tests for shared React DOM components in `packages/ui`. (file: .agent/skills/ui-test-authoring/SKILL.md)
- find-skills: Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. (file: ~/.agents/skills/find-skills/SKILL.md)
- skill-creator: Guide for creating effective skills. Use when creating a new skill or updating an existing skill that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: ~/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into `$CODEX_HOME/skills` from a curated list or a GitHub repo path. (file: ~/.codex/skills/.system/skill-installer/SKILL.md)

### How to use skills
- Discovery: The list above is the skills available in this workspace for Codex. Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why in one short line.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist, pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly, state the issue, pick the next-best approach, and continue.

## Testing preferences
- Prioritize functional tests over UI/UX tests.
- Add UI/UX tests only when a visible behavior should work differently and the failure is user-relevant.
- Prefer unit and integration coverage for business logic in this repo before adding E2E coverage.
- When endpoint behavior matters, E2E tests may target the backend running in Docker from the sibling repo `../salmon-api`.
- Before adding new E2E coverage, check whether `../salmon-api` already covers the behavior well enough to avoid redundant tests.
- E2E tests that depend on backend availability should skip when the backend is unreachable or not running.
- If the backend is reachable but the behavior is wrong, the test must fail rather than skip.
</INSTRUCTIONS>
