# Blinks Maestro flows

End-to-end flows for the Solana Actions / Blinks surface. Each flow is
state-modifying and self-contained (clearState + recover from seed).

## Layout

- `happy-path.yaml` — registry → detail → approval → success.
- `untrusted-host.yaml` — proves R1: off-registry deep-link is refused.
- `simulation-fail.yaml` — proves R2: simulate-before-sign + risk-toggle gate.
- `v0-feepayer-mismatch.yaml` — guarded sign error from Task 1.3.

Screenshots land under `apps/mobile/.maestro/screenshots/actions/blinks/`.

## How to run

From `apps/mobile/.maestro` (this is required — `takeScreenshot` paths
are cwd-relative; see `.maestro/AGENTS.md`):

```sh
cd apps/mobile/.maestro
maestro test flows/actions/blinks/happy-path.yaml
```

To run all four:

```sh
maestro test flows/actions/blinks/
```

## Required environment

Standard Salmon test env (recovery + password) plus a fixture server URL:

| Variable               | Used by                                             |
| ---------------------- | --------------------------------------------------- |
| `SALMON_TEST_PASSWORD` | recovery subflow                                    |
| `SALMON_TEST_SEED_A`   | recovery subflow                                    |
| `BLINKS_FIXTURE_URL`   | `simulation-fail`, `v0-feepayer-mismatch`, optional for `happy-path` |

`BLINKS_FIXTURE_URL` points at a local fixture server that serves the
Action GET/POST responses each flow expects. The simplest setup is a
static directory served via `python3 -m http.server`:

```sh
cd path/to/fixtures
python3 -m http.server 8080
# then export BLINKS_FIXTURE_URL=http://localhost:8080
```

Fixture authoring is **out of scope for this commit** — the YAMLs are
artifact-only scaffolds. A future task will land the fixture set and
wire the registry to point at the local host during e2e runs.

## Expected fixture endpoints

| Path                       | Used by                       | Behaviour                                                   |
| -------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `/happy/`                  | `happy-path.yaml`             | Action GET + POST returns a valid signable tx.              |
| `/sim-fail/`               | `simulation-fail.yaml`        | Action POST returns a tx the simulator rejects (preflight). |
| `/v0-feepayer-mismatch/`   | `v0-feepayer-mismatch.yaml`   | Action POST returns a v0 tx with a non-user feePayer slot.  |

## Notes

- Each YAML is < 60 lines and matches the existing actions/swap +
  actions/send style.
- testIDs are pinned in the source code as part of the same commit
  (`blinks-tab-list`, `blink-detail-continue`,
  `action-approval-approve`, `action-approval-risk-toggle`,
  `action-approval-error-banner`, `blink-success-title`,
  `blink-success-done`, `blink-detail-untrusted-host-message`).
- Flows are NOT yet wired into `suites/actions.yaml` — gate that on the
  fixture server landing.
