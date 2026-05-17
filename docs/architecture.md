# Architecture

## Monorepo layout

```
Socle/
  core/        Runtime library — copied to _lib/core/ in every scaffolded app
  modules/     Optional runtime modules — copied to _lib/modules/
  scaffold/    Template for new apps — mirrors the exact app directory structure
  cli/         npx socle entry point
  reference-app/  Real app using the library, proves every feature works
  docs/
```

`core/` and `modules/` contain browser code that runs in the app. `scaffold/` contains project tooling and config files that the developer owns and can edit.

## The `_lib/` boundary

When you scaffold a project, `core/` and your selected `modules/` are copied into `_lib/`. This is the single most important architectural rule:

**`_lib/` files never import from `app/`.** The dependency arrow points one way only:

```
app/ → _lib/
```

If any `_lib/` file references anything outside `_lib/`, the update mechanism breaks. `npx socle update` replaces `_lib/` entirely — it can only do this safely because `_lib/` has no knowledge of your app code.

## Build system

The build script at `utils/build.js` is plain Node.js with no dependencies beyond built-ins. It runs at deploy time and produces everything in `dist/`:

```
dist/
  main.[hash].js    ← hashed app entry point with APP_VERSION injected
  sw.js             ← Service Worker generated from _lib/core/sw.js
  version.json      ← { version, buildTime } for the update-notification flow
  index.html        ← processed with hashed asset filenames
  manifest.json     ← copied from project root
  _lib/             ← copy of _lib/ (ES modules need all imports present in dist/)
  app/              ← copy of app/ (page components imported by main.[hash].js)
```

Content hashing means browsers cache aggressively — a filename only changes when its content changes, so unchanged files are served from cache indefinitely.

### BASE_PATH

Apps deployed to GitHub Pages live at `https://user.github.io/repo-name/`, not `/`. The build script reads `BASE_PATH` from the environment and prefixes all asset URLs:

```bash
BASE_PATH=/my-app/ node utils/build.js
```

The included `deploy.yml` sets this automatically from the repository name. Local development uses the default `/`.

## Router

The router uses the History API (`pushState` / `popstate`). There is no hash routing.

### `navigate(path)`

Call `navigate()` from anywhere in your app to change the route. The import path depends on your file's location relative to `_lib/`:

```js
// from app/pages/goal-page.js
import { navigate } from '../../_lib/core/router/router.js';

navigate('/goals/42');
```

This pushes the path to the browser history and dispatches a `navigate` event on `window`. The `<app-router>` component listens for both `navigate` and `popstate` events and swaps the current page component accordingly.

Do not call `history.pushState()` directly — it will update the URL but not trigger the router.

### `<app-router>`

Place `<app-router>` in your `index.html`. It is the single outlet for all page components:

```html
<body>
  <app-router></app-router>
  <script type="module" src="%%MAIN_JS%%"></script>
</body>
```

In `main.js`, set its `routes` property after import:

```js
import '../_lib/core/router/app-router.js';
import './pages/home-page.js';
import './pages/not-found-page.js';

const router = document.querySelector('app-router');
router.routes = [
  { path: '/',         component: 'home-page' },
  { path: '/goals/:id', component: 'goal-page' },
  { path: '*',         component: 'not-found-page' },
];
```

Routes are matched in order — first match wins. Use `*` as the last entry to catch unmatched paths.

### Route parameters

Segments prefixed with `:` are captured as named parameters and set on the page component as a `params` property before it renders. Use them directly in `template()`:

```js
class GoalPage extends AppElement {
  template() {
    return `<main><h1>Goal ${this.params.id}</h1></main>`;
  }
}
```

Parameter values are URI-decoded automatically.

### Page components

Every page component must wrap its content in `<main>` so assistive technologies can navigate directly to page content:

```js
class GoalPage extends AppElement {
  template() {
    return `
      <style>:host { display: block; }</style>
      <main>
        <h1>Goal detail</h1>
      </main>
    `;
  }
}

customElements.define('goal-page', GoalPage);
```

### Hard refresh and the SW navigation intercept

When a user navigates to `/goals/42` and then hard-refreshes, the browser requests `/goals/42` from the server. A static file server returns 404 — there is no file at that path.

The Service Worker solves this: it intercepts all navigation requests (requests with `mode === 'navigate'`) and returns the cached `index.html` instead. The app shell loads, the router reads the current URL, and renders the correct page. This is why offline-first and SPA routing work together without a server-side fallback.

The SW intercept is active after the first visit, once the SW has installed and taken control of the page.

## Service Worker

The SW source lives at `_lib/core/sw.js` — library-owned, never edited directly. The build processes it into `dist/sw.js`, injecting:

- `CACHE_VERSION` — `{version}-{hash}`, changes on every build
- `ASSETS` — the list of files to precache, with correct `BASE_PATH` prefixes

The SW uses a cache-first strategy for all assets. On activate, it deletes all caches that do not match the current `CACHE_VERSION`, ensuring stale assets are cleaned up after an update.

`version.json` is never cached — it is fetched on every boot to detect available updates even before the SW update cycle fires.

The full SW update flow (waiting detection, update banner, skip-waiting) is implemented in Phase 5 by the `<sw-manager>` service component.

## Reference app

`reference-app/` is structured identically to a scaffolded user project, with one difference: `_lib/` is a symlink to the monorepo's `core/` and `modules/` directories rather than a copy. Library code changes are reflected immediately without a sync step.

The reference app proves every library feature works end-to-end before it is considered complete. If a feature cannot be demonstrated meaningfully in the reference app, it is not done.
