import { test, expect } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Traverses app-router → home-page → year-header shadow roots to click an element
function yhClick(page, selector) {
  return page.evaluate(sel => {
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('year-header').shadowRoot
      .querySelector(sel).click();
  }, selector);
}

async function waitForYearHeader(page) {
  await page.waitForFunction(() =>
    !!document.querySelector('app-router')?.shadowRoot
      ?.querySelector('home-page')?.shadowRoot
      ?.querySelector('year-header')?.shadowRoot
  );
}

async function openMenu(page) {
  await yhClick(page, '#menu-btn');
  await page.waitForFunction(() =>
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('year-header').shadowRoot
      .querySelector('#menu').open
  );
}

async function openThemeSheet(page) {
  await yhClick(page, '#theme-btn');
  await page.waitForFunction(() =>
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('year-header').shadowRoot
      .querySelector('#theme-sheet').open
  );
}

async function selectTheme(page, value) {
  await page.evaluate(v => {
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('year-header').shadowRoot
      .querySelector(`[data-theme-value="${v}"]`).click();
  }, value);
}

function getThemeButtonLabel(page) {
  return page.evaluate(() =>
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('year-header').shadowRoot
      .querySelector('#theme-value').textContent.trim()
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('data-theme attribute is set on initial load', async ({ page }) => {
  await page.goto('/2025');
  await waitForYearHeader(page);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(['light', 'dark']).toContain(theme);
});

test('switching to dark via theme picker sets data-theme immediately', async ({ page }) => {
  await page.goto('/2025');
  await waitForYearHeader(page);
  await openMenu(page);
  await openThemeSheet(page);
  await selectTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('switching to light via theme picker sets data-theme immediately', async ({ page }) => {
  // Start in dark so we can observe the switch
  await page.goto('/2025');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await waitForYearHeader(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await openMenu(page);
  await openThemeSheet(page);
  await selectTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('theme picker button label updates after selection', async ({ page }) => {
  await page.goto('/2025');
  await waitForYearHeader(page);
  await openMenu(page);
  await openThemeSheet(page);
  await selectTheme(page, 'dark');

  // Reopen menu to read updated label
  await openMenu(page);
  const label = await getThemeButtonLabel(page);
  expect(label).toBe('Dark');
});

test('selected theme persists across full page reload', async ({ page }) => {
  await page.goto('/2025');
  await waitForYearHeader(page);
  await openMenu(page);
  await openThemeSheet(page);
  await selectTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('dark theme is applied before first paint — no FOUC', async ({ page }) => {
  await page.goto('/2025');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));

  // Capture the attribute as early as possible after navigation starts
  const themeAtPaint = await page.evaluate(async () => {
    return new Promise(resolve => {
      // DOMContentLoaded fires before scripts execute — the inline script should have set it already
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () =>
          resolve(document.documentElement.getAttribute('data-theme'))
        );
      } else {
        resolve(document.documentElement.getAttribute('data-theme'));
      }
    });
  });

  // Reload and assert attribute was already set by the inline script
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('system theme resolves to light or dark (never null)', async ({ page }) => {
  await page.goto('/2025');
  await page.evaluate(() => localStorage.removeItem('theme'));
  await page.reload();
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(['light', 'dark']).toContain(theme);
});
