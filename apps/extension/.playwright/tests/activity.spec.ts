/**
 * Activity flow: open the transaction history from home and return, via the
 * data-testid contract (home-activity-button, activity-list/activity-empty,
 * screen-header-back-button). If the test wallet has history, also opens the
 * first row's detail modal and closes it. Skips when salmon-api is unreachable.
 */
import { test, expect } from '../fixtures';
import { isBackendUp } from '../env';
import { unlockOrRecover, waitHome } from '../helpers';

let backendUp = false;

test.beforeAll(async () => {
  backendUp = await isBackendUp();
});

test('opens the activity list and returns home via the data-testid contract', async ({ popup }) => {
  test.skip(!backendUp, 'salmon-api (127.0.0.1:3001) not reachable');

  await unlockOrRecover(popup);
  await waitHome(popup);

  await popup.getByTestId('home-activity-button').click();
  await expect(
    popup.getByTestId('activity-list').or(popup.getByTestId('activity-empty'))
  ).toBeVisible({ timeout: 20_000 });

  // If there is history, open a row's detail and close it.
  const row = popup.getByTestId('activity-tx-row').first();
  if (await row.count()) {
    await row.dblclick();
    const modal = popup.getByTestId('tx-detail-modal');
    if (await modal.isVisible().catch(() => false)) {
      await popup.getByTestId('tx-detail-close-button').click();
      await expect(modal).toHaveCount(0);
    }
  }

  await popup.getByTestId('screen-header-back-button').click();
  await expect(popup.getByTestId('home-screen')).toBeVisible();
});
