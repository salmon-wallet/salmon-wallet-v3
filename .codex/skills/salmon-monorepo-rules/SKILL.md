---
name: salmon-monorepo-rules
description: Resolve package ownership, shared-vs-app boundaries, and placement decisions in salmon-wallet-v3. Use this skill whenever a task could change where code lives across `packages/shared`, `packages/ui`, `apps/mobile`, `apps/web`, or `apps/extension`.
---

Canonical ownership guide for Salmon Wallet V3.

## Mandatory stance

- Prefer existing repo patterns over inventing new structure.
- Search current packages and apps before creating new modules.
- Keep architecture decisions aligned with `AGENTS.md` and `docs/ARCHITECTURE.md`.

## Core rules

- `packages/shared` is for logic and contracts shared by mobile, web, and extension.
- `packages/ui` is for shared React DOM components used by web and extension.
- `apps/mobile` is for React Native code and mobile-only flows.
- `apps/web` is for web app shell, routing, and browser-specific wiring.
- `apps/extension` is for extension entrypoints, pages, sheets, and browser-extension specifics.
- `packages/shared/src/theme` is the single source of shared design tokens.

## Decision checklist

- Is this code truly shared across runtimes?
- Is it semantic logic or visual DOM UI?
- Does it depend on browser APIs or React Native APIs?
- Does it belong in an app shell rather than a shared package?
- Does a matching contract already exist in `packages/shared`?

## Audit mode

When asked to audit structure, check for:

- platform-only code living in shared packages
- DOM components holding business logic that belongs in shared
- duplicated contracts across apps instead of one shared source
- browser or native API leaks in cross-platform hooks

## What this skill should produce

- a concrete placement recommendation
- a short rationale tied to current monorepo ownership
- warnings when a proposal would blur shared/app boundaries
