import { test, expect } from '@playwright/test';

const currentYear = new Date().getFullYear();

async function waitForHomePage(page) {
  await page.waitForFunction(() =>
    !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
  );
}

test.describe('Router — forward navigation', () => {
  test('renders home-page at /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-router')).toBeAttached();
    await waitForHomePage(page);
  });

  test('renders not-found-page for an unknown route', async ({ page }) => {
    // /foo/bar has two segments — does not match /:year, falls through to *
    await page.goto('/foo/bar');
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('not-found-page')
    );
  });
});

test.describe('Router — back navigation', () => {
  test('returns to home-page after browser back', async ({ page }) => {
    await page.goto(`/${currentYear}`);
    await waitForHomePage(page);

    await page.goto('/foo/bar');
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('not-found-page')
    );

    await page.goBack();
    await waitForHomePage(page);
  });
});

test.describe('Year-header — scroll compression', () => {
  test('header gains compact class when scrolled past 80px', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    // Make page tall enough to scroll
    await page.evaluate(() => {
      document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('main').style.paddingBlockEnd = '2000px';
    });

    await page.evaluate(() => window.scrollTo(0, 100));

    await page.waitForFunction(() => {
      const header = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('year-header');
      return header?.classList.contains('compact');
    });
  });

  test('header loses compact class when scrolled back above 60px', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
    );

    await page.evaluate(() => {
      document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('main').style.paddingBlockEnd = '2000px';
    });

    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => {
      const header = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('year-header');
      return header?.classList.contains('compact');
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => {
      const header = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('year-header');
      return !header?.classList.contains('compact');
    });
  });
});

test.describe('Router — SW navigation intercept', () => {
  test('serves app shell on hard refresh at a non-root URL', async ({ page }) => {
    // First visit installs the SW
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    // Hard navigate to multi-segment unknown route — SW intercepts and serves index.html
    await page.goto('/foo/bar');
    await page.waitForFunction(() =>
      !!document.querySelector('app-router')?.shadowRoot?.querySelector('not-found-page')
    );
  });
});
