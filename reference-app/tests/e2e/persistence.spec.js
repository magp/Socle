import { test, expect } from '@playwright/test';

const waitForHomePage = page => page.waitForFunction(() =>
  !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
);

test.describe('Data persistence', () => {
  test('goal completion state persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    const card = page.locator('home-page goal-card').last();
    await expect(card).toHaveAttribute('aria-pressed', 'false');

    await card.click();
    // IDB write completes before state notifies subscribers, so aria-pressed
    // being true guarantees the event is persisted before we reload
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await waitForHomePage(page);

    await expect(page.locator('home-page goal-card').last()).toHaveAttribute('aria-pressed', 'true');
  });

  test('goal completion survives multiple toggles across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    const card = page.locator('home-page goal-card').last();

    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'false');
    await card.click();
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await waitForHomePage(page);

    await expect(page.locator('home-page goal-card').last()).toHaveAttribute('aria-pressed', 'true');
  });

  test('goal count persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');

    await page.reload();
    await waitForHomePage(page);
    await expect(page.locator('home-page #count')).toHaveText('1');
  });

  test('multiple goals accumulate and persist across reload', async ({ page }) => {
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
});
