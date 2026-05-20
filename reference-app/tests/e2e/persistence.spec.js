import { test, expect } from '@playwright/test';

test.describe('Data persistence', () => {
  test('goal count persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');

    await page.reload();

    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );
    await expect(page.locator('home-page #count')).toHaveText('1');
  });

  test('multiple goals accumulate and persist across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    await page.locator('home-page #add').click();
    await page.locator('home-page #add').click();
    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('3');

    await page.reload();

    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );
    await expect(page.locator('home-page #count')).toHaveText('3');
  });
});
