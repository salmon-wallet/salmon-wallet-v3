/**
 * Pilot spec for the test-label migration: drives the lock/unlock flow using
 * the stable data-testid contract (lock-password-input, lock-unlock-button)
 * instead of input[type=password] + role-name regex.
 *
 * Skips when salmon-api is unreachable (repo e2e policy: skip when backend is
 * down, fail when it is up but behaves wrong).
 */
import { test, expect } from '../fixtures';
import { isBackendUp } from '../env';
import { unlockOrRecover, waitHome } from '../helpers';

let backendUp = false;

test.beforeAll(async () => {
  backendUp = await isBackendUp();
});

test('unlocks the wallet and reaches home via the data-testid contract', async ({ popup }) => {
  test.skip(!backendUp, 'salmon-api (127.0.0.1:3001) not reachable');

  const state = await unlockOrRecover(popup);
  expect(['unlocked', 'recovered', 'home']).toContain(state);

  await waitHome(popup);

  // The lock screen is gone (unlock succeeded) and the home screen is shown.
  await expect(popup.getByTestId('lock-password-input')).toHaveCount(0);
  await expect(popup.getByTestId('home-screen')).toBeVisible();
});
