---
name: api-service-authoring
description: "Create or modify shared API services in packages/shared/src/api/services. Use this skill when a task adds a new endpoint, integrates an external API, changes HTTP fetching logic, introduces caching, rate limiting, API client selection, or DI adapters in @salmon/shared. Also use it when auditing shared service consistency. Use together with salmon-repo-rules if ownership, exports, or shared-vs-app placement is unclear."
---

Shared API services power mobile, web, and extension. Keep them aligned with the repo's cache, error, and DI patterns.

## Workflow

1. Read `salmon-repo-rules` first if placement, exports, or ownership are unclear.
2. Search existing services, shared types, and adapters before creating anything new.
3. Read [references/service-patterns.md](references/service-patterns.md).
4. Choose `apiClient` vs `staticApiClient`.
5. Decide the caching model: `SmartCache<T>`, promise cache, or no cache.
6. Create or extend the service in `packages/shared/src/api/services/`.
7. Update barrels in `packages/shared/src/api/services/index.ts` and `packages/shared/src/api/index.ts`.
8. Add or extend co-located tests, following `shared-test-authoring` for non-trivial coverage.

## Clarification gate

Ask 1-3 focused questions if any of these are unclear:

- Does a similar service or endpoint already exist that could be extended?
- What's the expected cache TTL for this data?
- Does this service need rate limiting or chunked requests?
- Will this service be injected into account classes via DI, or called directly from hooks?
- Which API base URL should this use — `apiClient` (main) or `staticApiClient` (CDN)?
- Does the data belong in `@salmon/shared`, or is it platform-local?

## Rules

- Services live in `packages/shared/src/api/services/` — they are cross-platform by definition.
- Use `apiClient` or `staticApiClient` from the shared API client — never create new Axios instances.
- Use `SmartCache<T>` for data that doesn't need real-time freshness.
- Return typed responses using `ApiResponse<T>` or domain-specific types.
- Handle errors explicitly: return `null`, throw, or provide fallback data on purpose.
- For blockchain APIs with rate limits, use chunked requests with concurrency control.
- DI adapter functions export a record of functions that account classes can consume.
- Export named functions only through public barrels.

## Audit mode

When asked to audit API services, check for:

- Services that create their own Axios instances instead of using `apiClient` / `staticApiClient`
- Services with no caching for data that doesn't need real-time freshness
- Missing error handling (no try-catch around API calls)
- Services without DI adapter functions when they feed into account classes
- Inconsistent error patterns (some return null, others throw, without clear reason)
- Services with no corresponding test file
- Cache instances without `clear` functions (prevents testing and manual refresh)
- Hardcoded API URLs instead of using the configured base URL

Report findings with file paths and specific recommendations.

## What this skill should produce

- A service that follows existing patterns for caching, error handling, and typing.
- DI adapter functions when the service feeds into account classes.
- Tests for the service when behavior changed or new behavior was added.
- An audit report when asked to review service patterns or consistency.
- Questions first when caching strategy, rate limits, or API base URL are unclear.
