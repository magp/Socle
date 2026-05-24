import { test, expect } from '@playwright/test';

const waitForHomePage = page => page.waitForFunction(() =>
  !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
);

/*
 * Persistence tests verify that your app's data survives a page reload.
 * The tests below use the scaffolded home-page as a starting point.
 * Replace or extend them with assertions specific to your domain.
 *
 * Pattern for testing domain state persistence:
 *   1. Perform an action that writes to the store
 *   2. Confirm the UI reflects the change
 *   3. Reload the page
 *   4. Confirm the UI still reflects the change
 *
 * For domain state that is not directly visible in the UI, use page.evaluate()
 * to read from the shadow DOM or to dispatch events directly. Example:
 *
 *   await page.evaluate(() => {
 *     document.querySelector('home-page')?.shadowRoot
 *       ?.querySelector('#goals')
 *       ?.dispatchEvent(new CustomEvent('your-event', { bubbles: true, composed: true, detail: { ... } }));
 *   });
 */

test.describe('Data persistence', () => {
  test('item count persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');

    await page.reload();
    await waitForHomePage(page);
    await expect(page.locator('home-page #count')).toHaveText('1');
  });

  test('multiple items accumulate and persist across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    await page.locator('home-page #add').click();
    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('3');

    await page.reload();
    await waitForHomePage(page);
    await expect(page.locator('home-page #count')).toHaveText('3');
  });

  // Add domain-specific persistence tests here.
  // See the comment block above for the recommended pattern.
});
