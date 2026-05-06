# Salmon Wallet V3 Architecture

This document describes the architecture of the monorepo by folder responsibilities. The goal is to make clear where each kind of code lives and how to decide ownership when new features are added.

## General Idea

The repo follows a monorepo structure with separation by ownership and platform:

- `packages/shared`
  - logic shared between mobile, web, and extension
- `packages/ui`
  - shared React DOM components used by web and extension
- `packages/assets`
  - shared static assets (icons, images) consumed across apps
- `apps/mobile`
  - React Native app and mobile-only UI
- `apps/web`
  - web app
- `apps/extension`
  - browser extension

Central rule:

- if something has to work on all three platforms, it tends toward `packages/shared`
- if something is shared DOM UI between web and extension only, it tends toward `packages/ui`
- if it depends on native APIs, mobile navigation, or app-specific concerns, it stays in its app

## Responsibilities by Folder

### Repo root

- `apps/`
  - entrypoints and surfaces of each application
- `packages/`
  - shared and reusable code within the monorepo
- `docs/`
  - living documentation of the repo
- `.agent/` and `.claude/`
  - existing project workflow and skills
- `.codex/`
  - repo-local skills for Codex

### `packages/shared/`

The logical core of the monorepo.

Responsibility:

- shared API services
- blockchain logic
- reusable hooks
- semantic types
- storage and configuration
- shared utilities and crypto
- design tokens

Important subfolders:

- `packages/shared/src/api/`
  - HTTP clients, configuration, and shared services against the backend
- `packages/shared/src/blockchain/`
  - blockchain logic by domain
- `packages/shared/src/blinks/`
  - cross-platform Solana Actions / Blinks namespace (see below)
- `packages/shared/src/hooks/`
  - cross-platform hooks
- `packages/shared/src/theme/`
  - base visual tokens
- `packages/shared/src/types/`
  - shared semantic types
- `packages/shared/src/storage/`
  - persistence contracts and helpers
- `packages/shared/src/utils/`
  - genuinely shared utilities

It should not contain:

- platform-specific DOM components
- React Native components
- logic dependent on a single app with no real reuse

#### `packages/shared/src/blinks/`

Cross-platform Solana Actions / Blinks core, organized into four subfolders:

- `blinks/registry/` — async fetch of the Blinks allowlist from `salmon-api` (`GET /v1/blinks/registry`) with in-memory cache, persistent storage, and a hardcoded fallback when the network is unavailable.
- `blinks/client/` — `fetchActionMetadata` and `requestActionTransaction` (HTTPS-only, registry-gated, 10s timeout, 64 KiB response cap).
- `blinks/simulate/` — `simulateActionTx`: mandatory pre-sign simulation with Address Lookup Table resolution and partial-signature verification via `tweetnacl`.
- `blinks/spec/` — Zod schemas validating Action GET/POST shapes at runtime.

### `packages/ui/`

Responsibility:

- React DOM components shared between web and extension
- shared DOM layouts
- visual utilities specific to that layer

It should not contain:

- heavy business logic
- hooks that belong in `packages/shared`
- React Native code

### `apps/mobile/`

Responsibility:

- React Native implementation
- mobile-only components
- adaptations of shared contracts to native UI
- navigation and mobile runtime concerns

It should not contain:

- logic that should be reused in web and extension
- DOM components

### `apps/web/`

Responsibility:

- web shell
- routing and web providers
- pages and web-specific wiring
- browser-only adaptations

### `apps/extension/`

Responsibility:

- browser extension shell
- background/content/injected entrypoints
- pages and sheets specific to the extension
- compatibility with browser APIs

## Ownership by type of change

### New endpoint or backend integration

- if the consumer is shared, it goes through `packages/shared/src/api/services`
- if the contract affects hooks or types, they are updated in `packages/shared`
- the apps consume that contract but should not reinvent it

### New blockchain logic

- if it applies to more than one platform, it lives in `packages/shared/src/blockchain/<chain>`
- if it is only visual wiring or app interaction, it stays in the app

### New hook

- if it is cross-platform and semantic, it goes to `packages/shared/src/hooks`
- if it depends on browser APIs or React Native APIs, it must live in the corresponding app

### New component

- if it is shared DOM between web and extension, it goes to `packages/ui`
- if it is React Native, it goes to `apps/mobile`
- if it is specific to one web/extension app, it stays in that app

## Important layers within `packages/shared`

### `api`

- shared backend contract
- services reusable by multiple apps

### `blockchain`

- per-chain logic
- adapters and semantic helpers of the crypto domain

The currently active folders are:

- `bitcoin`
- `ethereum`
- `solana`

The intent is to keep per-chain logic isolated, without mixing concerns across domains.

### `blinks`

- Solana Actions / Blinks core (registry, client, simulate, spec) consumed by every app surface that renders or executes Blinks.

### `hooks`

- orchestrate reusable state and behavior
- connect services, blockchain logic, storage, and types

### `theme`

- single source of shared tokens
- colors, spacing, typography, shadows, and durations

## Testing

Practical rule:

- shared logic: tests in `packages/shared`
- shared DOM components: tests in `packages/ui`
- React Native UI or integration: tests in `apps/mobile`
- web/extension-specific wiring: tests in their app when they really add value

Priority:

- unit and integration tests for shared logic
- UI tests only when the visible behavior is important
- E2E against backend only if there is not enough coverage in `../salmon-api`

## Misplacement signals

- a React Native component appears in `packages/shared` or `packages/ui`
- a shared DOM component starts to contain large business logic
- a shared hook uses browser-only or native-only APIs
- an app duplicates contracts that already exist in `packages/shared`
- visual types specific to one platform end up in shared semantic types

## Current design state

The main monorepo separation is sound:

- `packages/shared` as the shared core
- `packages/ui` as the shared DOM layer
- apps separated by runtime

The important discipline to preserve is ownership:

- shared for cross-platform contracts and logic
- ui for shared DOM
- app-local for runtime/platform specifics
