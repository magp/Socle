import { test, expect } from '@playwright/test';

test.describe('Offline behaviour', () => {
  test('app loads from cache when offline after first visit', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    // Wait for full app init — ensures all module files are fetched and cached by the SW
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    await context.setOffline(true);
    await page.reload();

    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );
    await expect(page.locator('app-router')).toBeAttached();
  });

  test('app remains functional offline — can add a goal', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    await context.setOffline(true);

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');
  });
});
