/**
 * Web foundation smoke: boots the app via the dev server and, when an existing
 * wallet lands on the lock screen, asserts the password field is reachable by
 * the shared data-testid contract (lock-password-input).
 *
 * Skips when salmon-api is unreachable (repo e2e policy). Full unlock/recover
 * web flows need a seeded wallet (storageState) — that is the next step.
 */
import { test, expect } from '@playwright/test';
import { isBackendUp } from '../env';

let backendUp = false;

test.beforeAll(async () => {
  backendUp = await isBackendUp();
});

test('web app boots and honors the data-testid contract on the lock screen', async ({ page }) => {
  test.skip(!backendUp, 'salmon-api (127.0.0.1:3001) not reachable');

  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();

  const lockInput = page.getByTestId('lock-password-input');
  if (await lockInput.count()) {
    await expect(lockInput).toBeVisible();
  }
});
