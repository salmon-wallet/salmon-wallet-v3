/**
 * Flow helpers shared across extension specs. Ported from scripts/lib.mjs.
 *
 * The lock path now selects by the stable data-testid contract
 * (lock-password-input / lock-unlock-button). The recover/onboarding path
 * still uses role/CSS selectors because those screens are not labeled yet —
 * they are the next rollout target.
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

  const recoverButton = page.getByRole('button', { name: /recover account/i });
  if (await recoverButton.count()) {
    await recoverButton.click();
    await page.waitForTimeout(1500);
    await page.locator('textarea').first().fill(seedA());
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.waitForTimeout(1500);
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password());
    await passwordInputs.nth(1).fill(password());
    await page.getByRole('button', { name: /recover account/i }).click();
    await page.waitForTimeout(4000);
    const goToAccount = page.getByRole('button', { name: /go to my/i });
    if (await goToAccount.count()) {
      await goToAccount.click();
      await page.waitForTimeout(2500);
    }
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
