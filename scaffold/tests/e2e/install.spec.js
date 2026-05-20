import { test } from '@playwright/test';

/*
 * Manual PWA install checklist
 * The beforeinstallprompt event cannot be reliably triggered in Playwright.
 * Run through this checklist manually in Chrome or Firefox before every release.
 *
 * [ ] App is served over HTTPS (or localhost for local testing)
 * [ ] manifest.json is valid — DevTools > Application > Manifest, no errors shown
 * [ ] Service worker is registered and active — DevTools > Application > Service Workers
 * [ ] SW scope covers the full app path (check "Scope" field)
 * [ ] Install prompt appears in Chrome/Edge on second visit (address bar icon or banner)
 * [ ] Installed app opens in standalone mode (no browser chrome)
 * [ ] App icon is correct on home screen / app launcher
 * [ ] Splash screen displays correctly on Android
 * [ ] App is fully functional offline when installed (no network, full reload)
 * [ ] Update banner appears after deploying a new build and reopening the installed app
 * [ ] Tapping Reload on the update banner applies the new version correctly
 */

test.skip('PWA install — manual verification required', async () => {
  // See checklist above. Run before every release.
});
