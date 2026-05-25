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

    // Enter edit mode and open the add-capstone dialog
    await page.evaluate(() => {
      document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('#capstone-edit-btn').click();
    });
    await page.evaluate(() => {
      document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('#add-capstone').click();
    });
    await page.waitForFunction(() => {
      const d = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('goal-dialog')?.shadowRoot
        ?.querySelector('dialog');
      return d?.open;
    });
    await page.evaluate(() => {
      const inp = document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('goal-dialog').shadowRoot
        .querySelector('input');
      inp.value = 'Offline goal';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('goal-dialog').shadowRoot
        .querySelector('#save').click();
    });
    await page.waitForFunction(() => {
      const list = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('#capstone-list');
      return list?.querySelectorAll('goal-item').length > 0;
    });

    const title = await page.evaluate(() => {
      const item = document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('#capstone-list goal-item');
      return item?._goal?.title;
    });
    expect(title).toBe('Offline goal');
  });
});
