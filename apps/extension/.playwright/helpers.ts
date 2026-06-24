/**
 * Flow helpers shared across extension specs. Ported from scripts/lib.mjs.
 *
 * Both the lock path and the recover/onboarding path select by the stable
 * data-testid contract (lock-*, select-recover-button, recover-seed-input,
 * recover-next-button, password-input/confirm, password-submit-button,
 * success-go-to-wallet-button).
 */
import { type Page } from '@playwright/test';

const password = (): string => process.env.SALMON_TEST_PASSWORD ?? '';
const seedA = (): string => process.env.SALMON_TEST_SEED_A ?? '';

export type EntryState = 'unlocked' | 'recovered' | 'home';

export async function unlockOrRecover(page: Page): Promise<EntryState> {
  const passwordInput = page.getByTestId('lock-password-input');
  if (await passwordInput.count()) {
    await passwordInput.fill(password());
    await page.getByTestId('lock-unlock-button').click();
    await page.waitForTimeout(3000);
    return 'unlocked';
  }

  const recoverButton = page.getByTestId('select-recover-button');
  if (await recoverButton.count()) {
    await recoverButton.click();
    // Auto-waiting actions (no fixed sleeps): each step waits for its target
    // to be actionable. recover-next-button is visibility-toggled until the
    // seed validates; success appears only after the creation loading screen.
    await page.getByTestId('recover-seed-input').fill(seedA());
    await page.getByTestId('recover-next-button').click({ timeout: 30_000 });
    await page.getByTestId('password-input').fill(password());
    await page.getByTestId('password-confirm-input').fill(password());
    await page.getByTestId('password-submit-button').click();
    await page
      .getByTestId('success-go-to-wallet-button')
      .click({ timeout: 60_000 })
      .catch(() => {});
    return 'recovered';
  }

  return 'home';
}

export async function waitHome(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        /\$\d/.test(document.body.innerText) &&
        /Solana|Bitcoin/.test(document.body.innerText),
      { timeout: 15_000 }
    )
    .catch(() => {});
}
