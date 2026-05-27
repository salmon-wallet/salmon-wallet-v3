# Playwright extension test suite

Lives at `apps/extension/.playwright/`. Drives the extension build through
Chromium with Playwright. Each script targets a single workflow and writes
screenshots, snapshots, and a findings report.

> Tracked content: `scripts/`, `README.md`, `AGENTS.md`, and
> `.env.test.example`. Everything else (`profiles/`, `screenshots/`,
> `snapshots/`, `reports/`, `fixtures/`, `.env.test`) is local-only.

## Layout

| Path | Purpose |
|---|---|
| `scripts/` | Runnable `.mjs` test scripts + shared `lib.mjs` |
| `scripts/lib.mjs` | Shared helpers: `launch`, `openPopup`, `unlockOrRecover`, `waitHome`, `capture`, `waitForButtonEnabled`, secrets loader |
| `fixtures/` | Generated artifacts that scripts depend on (e.g. `wallet-b-addr.txt`) |
| `profiles/extension/` | Persistent Chromium profile — wallet recovery, dev-mode toggle, etc. survive across runs |
| `reports/` | Markdown reports written by each script |
| `.env.test` | Secrets (test seeds + password). Loaded by `lib.mjs`. Never inline elsewhere |

`screenshots/` and `snapshots/` are recreated by `lib.mjs` on first capture
inside a script run. They are deliberately not checked in.

There is a sibling directory `~/.claude/skills/playwright-cli/` that
auto-generates `.playwright-cli/` artifacts in any repo where the global
`playwright-cli` skill runs. That tool is **separate** from this suite —
`.playwright-cli/` can be deleted at any time without affecting these
scripts.

## Prerequisites

1. **Chromium** via Playwright. Either:
   - `npm i -D playwright` in the repo root, or
   - keep the global `@playwright/cli` install (resolved by `lib.mjs`
     automatically), or
   - export `PLAYWRIGHT_PATH=/abs/path/to/playwright/index.mjs`.

2. **Extension build**. The scripts load `apps/extension/dist/chrome-mv3`.
   For local-backend testing build with development mode so the bundle
   targets `localhost:3001/local`:
   ```sh
   cd apps/extension
   pnpm build --mode development
   # build emits dist/chrome-mv3-dev — symlink for the test runner:
   ln -sfn chrome-mv3-dev dist/chrome-mv3
   ```
   Build with default mode (`pnpm build`) produces a prod-pointing bundle —
   useful for smoke tests against the staging API but tokens/NFTs come from
   real production data.

3. **`salmon-api` backend** running on `127.0.0.1:3001` (see sibling repo
   `../salmon-api`, `npm run serverless:start:local`). Verify with
   `curl http://127.0.0.1:3001/local/health`.

4. **`apps/extension/.playwright/.env.test`** populated (copy from `.env.test.example`):
   ```
   SALMON_TEST_PASSWORD=<password>
   SALMON_TEST_SEED_A=<12-word mnemonic>
   SALMON_TEST_SEED_B=<12-word mnemonic>
   ```
   `lib.mjs` throws on startup if any are missing.

## Running scripts

All scripts are standalone Node ESM. Run from the repo root:

```sh
node apps/extension/.playwright/scripts/<name>.mjs
```

Background long-running scripts and tail the report when done:

```sh
node apps/extension/.playwright/scripts/walkthrough.mjs &
tail -f apps/extension/.playwright/reports/PHASE1-WALKTHROUGH.md
```

## Script index

### Setup / debug

| Script | Purpose |
|---|---|
| `bootstrap.mjs` | Quick infra sanity check — launches the extension, opens the popup, captures the initial state. Run first when something feels off. |
| `interactive-launch.mjs` | Opens Chromium with the extension loaded and **stays alive** until Ctrl-C. Useful for manual exploration or attaching DevTools. |
| `state-check.mjs` | Verifies the persisted profile is intact (wallet recovered, NFTs present). Run after destructive tests. |

### Phase 1 — read-only (no on-chain side effects)

| Script | What it covers |
|---|---|
| `walkthrough.mjs` | Full sweep — onboarding, recover, home, tabs (Home/Collectibles/Swap), Send/Receive/Activity, every Settings panel via the legacy in-place driver. |
| `settings-panels.mjs` | The 10 Settings sub-panels, each captured from a **fresh popup** (works around an SPA route issue in the legacy walkthrough). |
| `lock-and-pages.mjs` | Lock cycle, re-lock-on-reload regression, About + Help & Support, NFT detail navigation. |
| `dapp-providers.mjs` | Inspects the injected `window.solana` / `window.salmon` provider against jup.ag, plus a deep dump of the Security panel. |

### Wallet plumbing

| Script | Purpose |
|---|---|
| `discover-wallet-addr.mjs` | Wipes profile, recovers with `SEED_B`, captures the Solana receive address, writes it to `fixtures/wallet-b-addr.txt`, then wipes profile so subsequent runs default back to `SEED_A`. **Run this once** before any cross-wallet test. |
| `nft-spam-filter.mjs` | Validates that toggling Developer Networks reveals scam cNFTs that the spam filter (`packages/shared/src/utils/nft-spam-filter.ts`) hides by default. Uses Wallet B which has known scam airdrops. |

### Phase 2 — state-modifying / on-chain

| Script | Action |
|---|---|
| `state-modifying.mjs` | Address Book Save (Wallet B), Send 0.001 SOL Wallet A → Wallet B (real on-chain mainnet). Waits for async address validation before clicking Save/Send. |
| `nft-transfer.mjs` | Send a Solana NFT from Wallet A to Wallet B. The dialog shows a Confirm modal directly (no Review step) and may trigger a password prompt that the driver does not currently handle — outcome inconclusive when fully automated. |
| `burn-cnft.mjs` | Burn the `JUP.PRO Drop Pass` scam cNFT from Wallet B (mainnet). Verified on-chain success. Selector targets `aria-label="Burn NFT"` — see lessons learned in `AGENTS.md`. |

## Reports

Each script writes one markdown file to `reports/`. Naming mirrors the
script:

- `walkthrough.mjs` → `reports/PHASE1-WALKTHROUGH.md`
- `settings-panels.mjs` → `reports/PHASE1-SETTINGS-PANELS.md`
- `lock-and-pages.mjs` → `reports/PHASE1-LOCK-AND-PAGES.md`
- `dapp-providers.mjs` → `reports/PHASE1-DAPP-PROVIDERS.md`
- `state-modifying.mjs` → `reports/PHASE2-STATE-MODIFYING.md`
- `nft-transfer.mjs` → `reports/PHASE2-NFT-TRANSFER.md`
- `burn-cnft.mjs` → `reports/BURN-CNFT.md`

`REPORT.md` at the suite root captures the most recent consolidated session
findings (bugs, false positives, validations).

## Common failure modes

- **Send button "absent" but visible in screenshot**: Salmon's home re-renders
  after waitHome occasionally. Use `waitForButtonEnabled` from `lib.mjs`
  rather than `count()` followed by `click()`.
- **Save Address disabled**: Salmon validates the address asynchronously
  (RPC call) before enabling Save. Use `waitForButtonEnabled` with at least
  10s timeout, or watch for the loading spinner inside the field to clear.
- **Profile clutter between iterations**: when a test branch becomes
  unreproducible, `rm -rf apps/extension/.playwright/profiles` and start fresh.
  Wallet recovery in `lib.mjs/unlockOrRecover` handles the onboarding case.
- **`PHASE2-V*` reports**: anything with a `V<n>` suffix is from a deleted
  iteration. The canonical reports drop that suffix.
