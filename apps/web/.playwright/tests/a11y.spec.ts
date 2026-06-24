/**
 * Accessibility smoke (axe-core) for the web app boot screen. Without a seeded
 * wallet (storageState) the app lands on the lock/welcome screen, so that is
 * what we scan today; once authenticated web flows exist this should grow to
 * cover home and the main flows.
 *
 * Gate policy mirrors the extension a11y spec: fails only on `critical`
 * violations, attaches the full violation list for triage. Runs on every
 * configured browser project (chromium + webkit). Skips when salmon-api is
 * unreachable.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { isBackendUp } from '../env';

let backendUp = false;

test.beforeAll(async () => {
  backendUp = await isBackendUp();
});

test('boot screen has no critical a11y violations', async ({ page }) => {
  test.skip(!backendUp, 'salmon-api (127.0.0.1:3001) not reachable');

  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await test.info().attach('axe-boot.json', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  const critical = results.violations.filter((v) => v.impact === 'critical');
  const summary = critical.map((v) => `${v.id} (${v.nodes.length})`).join(', ');
  expect(critical, `boot critical a11y violations: ${summary}`).toEqual([]);
});
