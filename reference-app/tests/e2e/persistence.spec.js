import { test, expect } from '@playwright/test';

const waitForHomePage = page => page.waitForFunction(() =>
  !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
);

test.describe('Data persistence', () => {
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

  test('goal completion state persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');

    // Dispatch a completion-change event directly — tests the persistence path
    // without depending on gesture mechanics (covered separately by unit tests)
    await page.evaluate(() => {
      const goals = document.querySelector('home-page')?.shadowRoot?.querySelector('#goals');
      const card = goals?.querySelector('goal-card');
      if (!card) return;
      goals.dispatchEvent(new CustomEvent('goal-completion-change', {
        bubbles: true, composed: true,
        detail: { id: card._goal.id, completion: 50 },
      }));
    });

    // Wait for DOM to reflect the store update before reloading
    await page.waitForFunction(() =>
      document.querySelector('home-page')?.shadowRoot
        ?.querySelector('goal-card')?.shadowRoot
        ?.querySelector('.progress-bar')?.getAttribute('aria-valuenow') === '50'
    );

    await page.reload();
    await waitForHomePage(page);

    const completionAfterReload = await page.evaluate(() =>
      document.querySelector('home-page')?.shadowRoot
        ?.querySelector('goal-card')?.shadowRoot
        ?.querySelector('.progress-bar')?.getAttribute('aria-valuenow')
    );
    expect(completionAfterReload).toBe('50');
  });

  test('deleted goal does not reappear after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await page.locator('home-page #add').click();
    await expect(page.locator('home-page #count')).toHaveText('1');

    // Focus the card and use keyboard Delete shortcut
    await page.evaluate(() =>
      document.querySelector('home-page')?.shadowRoot?.querySelector('goal-card')?.focus()
    );
    await page.keyboard.press('Delete');
    await expect(page.locator('home-page #count')).toHaveText('0');

    await page.reload();
    await waitForHomePage(page);
    await expect(page.locator('home-page #count')).toHaveText('0');
  });
});
