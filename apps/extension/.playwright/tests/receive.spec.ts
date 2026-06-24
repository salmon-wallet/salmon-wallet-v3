/**
 * Receive flow: open the receive sheet from home and close it, all via the
 * data-testid contract (home-receive-button, receive-sheet, receive-copy-button,
 * sheet-close-button). Skips when salmon-api is unreachable.
 */
import { test, expect } from '../fixtures';
import { isBackendUp } from '../env';
import { unlockOrRecover, waitHome } from '../helpers';

let backendUp = false;

test.beforeAll(async () => {
  backendUp = await isBackendUp();
});

test('opens and closes the receive sheet via the data-testid contract', async ({ popup }) => {
  test.skip(!backendUp, 'salmon-api (127.0.0.1:3001) not reachable');

  await unlockOrRecover(popup);
  await waitHome(popup);

  await popup.getByTestId('home-receive-button').click();
  await expect(popup.getByTestId('receive-sheet')).toBeVisible();
  await expect(popup.getByTestId('receive-copy-button')).toBeVisible();

  await popup.getByTestId('sheet-close-button').click();
  await expect(popup.getByTestId('receive-sheet')).toHaveCount(0);
  await expect(popup.getByTestId('home-screen')).toBeVisible();
});
