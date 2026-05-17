# Changelog

All notable changes to Socle are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- History API router (`core/router/router.js`) — `navigate(path)` helper and `matchRoute()` with `:param` segment support
- `<app-router>` Web Component (`core/router/app-router.js`) — page outlet that swaps components on `navigate` and `popstate` events; `routes` array accepts `path` and `component` entries; wildcard `*` route for 404 handling
- SW navigation intercept (`core/sw.js`) — `navigate`-mode requests return cached `index.html`, enabling hard refresh at any route; `clients.claim()` in activate so the SW takes control on first install
- Playwright E2E test infrastructure for the reference app (`reference-app/playwright.config.js`, `reference-app/tests/e2e/navigation.spec.js`) — covers forward navigation, 404 routes, and browser back; SW hard-refresh test scaffolded and skipped until Phase 5
- `/port` command — audits reference-app for files that should be ported to the scaffold; reports MISSING, STALE, TOKEN GAP, or OK per category without auto-fixing
- `/update-meta` command — end-of-session audit of CLAUDE.md and command files for gaps and stale content; proposes exact changes before applying
- `AppElement` base class (`core/app-element.js`) — extends `HTMLElement` with Shadow DOM setup, `adoptedStyleSheets`, and `render`/`subscribe`/`unsubscribe` lifecycle
- Base structural stylesheet (`core/styles/base.js`) — singleton `CSSStyleSheet` adopted by every shadow root; provides `:host { display: block }`, box-sizing, and tap-highlight reset
- Reference app document baseline — `tokens.css` linked in `index.html`, body reset using design tokens, `theme-color` set to palette background
- `docs/components.md` — full guide to building components with `AppElement`, including tiers, shadow DOM, the render lifecycle, and the subscribe pattern
- `/i18n` skill — audit tool for internationalisation compliance; enforces no hardcoded strings in `_lib/` and scaffolds the `t()`/`defineStrings()` pattern for new components
- Monorepo structure: `core/`, `modules/`, `scaffold/`, `cli/`, `reference-app/`, `docs/`
- Build script (`utils/build.js`) — content-hashed assets, `version.json`, SW template injection, `BASE_PATH` support for GitHub Pages subdirectory deployments
- CSS token system (`core/styles/tokens.css`) — warm neutral palette, accent theming via two CSS variables
- CSS animations (`core/styles/animations.css`) — page transitions, element entrances, bottom sheet, toasts, tap feedback, drag and swipe gesture classes; respects `prefers-reduced-motion`
- Service Worker template (`core/sw.js`) — cache-first strategy, cache versioning, activate-time stale-cache cleanup
- Scaffold templates (`scaffold/`) — mirroring the exact app directory structure with `%%TOKEN%%` placeholders for CLI substitution
- GitHub Actions workflow template (`scaffold/.github/workflows/deploy.yml`) — builds and deploys to GitHub Pages on push to main
- Reference app shell (`reference-app/`) — `_lib/` symlinked to monorepo `core/` and `modules/` for live development
- Claude Code project files for library development (`.claude/commands/`)

### Changed
- Build script now copies `_lib/` and `app/` into `dist/` so the output is self-contained for direct ES module serving; rewrites two import paths in the built `main.js` to match the `dist/` layout

---

<!--
Template for new versions:

## [x.y.z] — YYYY-MM-DD

### Added
-

### Changed
-

### Fixed
-

### Deprecated
-

### Breaking
-
Migration: describe what developers need to change in their app/ code.
-->
