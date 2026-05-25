# /status

Report the current build phase status and what should be worked on next.

## What to do

Check the file system against the build order defined in CLAUDE.md and report:

### Build phases (in order)

1. **Monorepo scaffolding + build script + reference app shell**
   - Check: `package.json`, `core/sw.js`, `scaffold/` directory structure
   - Check: `reference-app/utils/build.js`, `reference-app/index.html`, `reference-app/manifest.json`
   - Check: `reference-app/_lib/core` and `reference-app/_lib/modules` symlinks exist
   - Check: `reference-app/app/main.js`, `reference-app/tests/unit/`, `reference-app/tests/e2e/`

2. **AppElement + Shadow DOM + CSS token system**
   - Check: `core/app-element.js`, `core/styles/tokens.css`, `core/styles/base.js` (adoptedStyleSheets)
   - Check: `core/app-element.test.js`

3. **Router**
   - Check: `core/router/router.js`, `core/router/app-router.js`, SW navigation intercept in `sw.js`
   - Check: `core/router/router.test.js`, Playwright navigation test

4. **Store + IDB layer**
   - Check: `core/store/store.js`, `core/idb/idb.js`, `core/idb/migrations.js`
   - Check: corresponding test files

5. **SW lifecycle + update flow**
   - Check: `core/strings.js` (t/defineStrings registry)
   - Check: `core/sw-manager/sw-manager.js`, `core/components/update-banner/update-banner.js`
   - Check: `version.json` generation in build script
   - Check: `reference-app/app/strings.js` (English defaults, first import in `app/main.js`)
   - Check: `reference-app/tests/e2e/offline.spec.js`, `update-flow.spec.js`, `install.spec.js`

6. **Gesture library**
   - Check: `modules/gestures/gestures.js`, implemented gestures: tap, longPress, swipe (`onSwipe`/`onSwipeMove`), holdDrag (`onHoldDragStart`/`onHoldDrag`/`onHoldDragEnd`), `Gestures.attach` static method
   - Check: `modules/gestures/gestures.test.js`

7. **Reference app features (YourYear)**
   - Check: `reference-app/app/pages/year-redirect.js`, `home-page.js`, `not-found-page.js`
   - Check: `reference-app/app/components/goal-item/`, `goal-dialog/`, `year-header/`
   - Check: `reference-app/app/store/reducer.js` handles `GOAL_SET`, `GOAL_PROGRESS_SET`, `GOAL_FAIL`
   - Check: `reference-app/tests/e2e/goals.spec.js`, `persistence.spec.js` cover creation, deletion, progress, fail/restore
   - Check: `reference-app/tests/e2e/navigation.spec.js` covers year routing and scroll compression

8. **CLI scaffolding tool**
   - Check: `cli/index.js`, prompts for module selection

9. **P2P module (V2)**
   - Check: `modules/p2p/` — expected to not exist yet

### Output format

For each phase, report one of:
- ✅ Complete — key files present and tests exist
- 🔄 In progress — partially implemented, note what's missing
- ⬜ Not started

Then state clearly: **"Current phase: X — recommended next step: [specific task]"**

Do not start any work. Report only.
