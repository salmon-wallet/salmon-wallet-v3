/**
 * Global setup: load suite secrets and fail fast if the password is missing.
 * Backend reachability is checked per-spec (specs skip when salmon-api is
 * down, per the repo e2e policy), not here.
 */
import { loadTestEnv, requireSecrets } from './env';

export default function globalSetup(): void {
  loadTestEnv();
  requireSecrets(['SALMON_TEST_PASSWORD']);
}
