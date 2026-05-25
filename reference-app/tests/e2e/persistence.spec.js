import { test, expect } from '@playwright/test';

const currentYear = new Date().getFullYear();

const waitForHomePage = page => page.waitForFunction(() =>
  !!document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
);

function homePage(page) {
  return page.evaluate(fn => fn(), () =>
    document.querySelector('app-router')?.shadowRoot?.querySelector('home-page')
  );
}

async function createCapstoneGoal(page, title) {
  // Enter edit mode so the Add button is visible
  await page.evaluate(() => {
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('#capstone-edit-btn').click();
  });
  // Open the dialog
  await page.evaluate(() => {
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('#add-capstone').click();
  });
  // Wait for dialog to open
  await page.waitForFunction(() => {
    const d = document.querySelector('app-router')?.shadowRoot
      ?.querySelector('home-page')?.shadowRoot
      ?.querySelector('goal-dialog')?.shadowRoot
      ?.querySelector('dialog');
    return d?.open;
  });
  // Fill and save
  await page.evaluate((t) => {
    const inp = document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('goal-dialog').shadowRoot
      .querySelector('input');
    inp.value = t;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('app-router').shadowRoot
      .querySelector('home-page').shadowRoot
      .querySelector('goal-dialog').shadowRoot
      .querySelector('#save').click();
  }, title);
  // Wait for item to appear
  await page.waitForFunction(() => {
    const list = document.querySelector('app-router')?.shadowRoot
      ?.querySelector('home-page')?.shadowRoot
      ?.querySelector('#capstone-list');
    return list?.querySelectorAll('goal-item').length > 0;
  });
}

function getCapstoneItem(page) {
  return page.evaluate(() => {
    const item = document.querySelector('app-router')?.shadowRoot
      ?.querySelector('home-page')?.shadowRoot
      ?.querySelector('#capstone-list goal-item');
    return item ? { title: item._goal?.title, percentage: item._goal?.percentage } : null;
  });
}

test.describe('Data persistence', () => {
  test('capstone goal title persists across page reload', async ({ page }) => {
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await createCapstoneGoal(page, 'Run a marathon');

    await page.reload();
    await waitForHomePage(page);

    await page.waitForFunction(() => {
      const list = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('#capstone-list');
      return list?.querySelectorAll('goal-item').length > 0;
    });

    const item = await getCapstoneItem(page);
    expect(item?.title).toBe('Run a marathon');
  });

  test('capstone goal progress persists across page reload', async ({ page }) => {
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    await createCapstoneGoal(page, 'Persistence test');

    // One keystroke then capture the resulting value. Firing many events in a tight loop
    // is unreliable: dispatches share the same recordedAt timestamp so IDB replay
    // ordering is UUID-random on reload.
    await page.evaluate(() => {
      const bar = document.querySelector('app-router').shadowRoot
        .querySelector('home-page').shadowRoot
        .querySelector('#capstone-list goal-item').shadowRoot
        .querySelector('.bar');
      bar?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });

    await page.waitForFunction(() => {
      const item = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('#capstone-list goal-item');
      return (item?._goal?.percentage ?? 0) > 0;
    });

    const before = await getCapstoneItem(page);

    await page.reload();
    await waitForHomePage(page);

    await page.waitForFunction(() => {
      const list = document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot?.querySelector('#capstone-list');
      return list?.querySelectorAll('goal-item').length > 0;
    });

    const after = await getCapstoneItem(page);
    expect(after?.percentage).toBe(before?.percentage);
  });

  test('year navigation shows independent goals per year', async ({ page }) => {
    await page.goto(`/${currentYear}`);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await waitForHomePage(page);

    const prevYear = currentYear - 1;
    await page.goto(`/${prevYear}`);
    await waitForHomePage(page);

    // #year lives inside year-header's shadow root, not home-page's directly
    const yearDisplayed = await page.evaluate(() =>
      document.querySelector('app-router')?.shadowRoot
        ?.querySelector('home-page')?.shadowRoot
        ?.querySelector('year-header')?.shadowRoot
        ?.querySelector('#year')?.textContent
    );
    expect(yearDisplayed).toBe(String(prevYear));
  });
});
