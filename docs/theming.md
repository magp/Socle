# Theming

## Contents

- [Dark and light themes](#dark-and-light-themes)
- [Token system](#token-system)
- [Available tokens](#available-tokens)
- [Animations](#animations)

---

## Dark and light themes

Socle ships a warm-dark palette that activates via a `data-theme` attribute on `<html>`. The library handles OS preference detection, persistence, and runtime switching — your components need no changes.

### Setup

`initTheme()` is called once in `app/main.js`, before `setLocale` and `boot`:

```js
import { initTheme } from './_lib/core/theme/theme.js';
import './strings.js';
import { setLocale, getLocale } from './_lib/core/strings.js';
import { boot } from './_lib/core/store/store.js';

initTheme();
setLocale(getLocale());
await boot({ dbName: 'myapp', reducer });
```

`initTheme()` reads the user's stored preference from `localStorage`, falls back to the OS `prefers-color-scheme` media query, and sets `data-theme` on `<html>`. It also registers a listener so the theme updates automatically if the OS setting changes while the app is open in system mode.

### Anti-FOUC script

Without extra handling, a hard reload in dark mode briefly shows the light theme before JS runs. The scaffolded `index.html` includes an inline script in `<head>` that sets `data-theme` synchronously before the first paint:

```html
<script>
  (function() {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  })();
</script>
```

This script must run before any stylesheet is parsed. Keep it in `<head>`, before `<link rel="stylesheet">`. `initTheme()` in `main.js` then runs at boot and is a no-op if the attribute is already correct.

### Switching themes from your app

```js
import { setTheme, getTheme, onThemeChange } from './_lib/core/theme/theme.js';

// Read the current stored preference ('system' | 'light' | 'dark')
getTheme();  // → 'system'

// Switch — updates data-theme immediately and persists to localStorage
setTheme('dark');
setTheme('light');
setTheme('system');  // follows OS from this point on

// Subscribe to changes (returns an unsubscribe function)
const unsub = onThemeChange(theme => {
  // theme is the stored preference ('system' | 'light' | 'dark')
  console.log('theme changed to', theme);
});
unsub();  // clean up
```

`setTheme` throws on an invalid value. All other functions are safe to call at any time after `initTheme()`.

### How it works in CSS

`initTheme()` sets `data-theme="light"` or `data-theme="dark"` on `<html>`. The `[data-theme="dark"]` block in `tokens.css` overrides every colour token:

```css
[data-theme="dark"] {
  --color-bg:      #1C1C1E;
  --color-surface: #2C2C2E;
  /* ... all tokens overridden ... */
}
```

Because all components use CSS custom properties exclusively, the palette swap is instant and zero-JavaScript. No component needs a `data-theme` listener or conditional styling — just use tokens.

### Dark palette

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#F5F2EE` | `#1C1C1E` |
| `--color-surface` | `#FFFFFF` | `#2C2C2E` |
| `--color-surface-raised` | `#EEEAE4` | `#3A3A3C` |
| `--color-border` | `#E4E0DA` | `#48484A` |
| `--color-text-primary` | `#1C1C1E` | `#F5F2EE` |
| `--color-text-secondary` | `#8A8A8E` | `#AEAEB2` |
| `--color-text-muted` | `#AEAEB2` | `#6C6C70` |
| `--color-accent` | `#E8824A` | `#E8824A` (unchanged) |
| `--color-accent-light` | `#FDF0E8` | `rgba(232,130,74,0.15)` |

All dark values meet WCAG AA contrast against their respective backgrounds.

### The reference app

`year-header` in the reference app includes a theme picker sheet (System / Light / Dark) accessible from the app menu. See `reference-app/app/components/year-header/year-header.js` for a complete example of wiring `setTheme`, `getTheme`, and `onThemeChange` in a UI component.

---

## API reference

### `initTheme()`

Reads the stored preference, sets `data-theme` on `<html>`, and registers an OS change listener. Idempotent — safe to call multiple times, only runs once. Call in `app/main.js` before `boot()`.

### `setTheme(theme)`

**Parameters**
- `theme` `{'light' | 'dark' | 'system'}` — the preference to store and apply

Persists the preference to `localStorage`, updates `data-theme` immediately, and notifies `onThemeChange` listeners. Throws `Error` if `theme` is not one of the three valid values.

### `getTheme()`

**Returns** `{'light' | 'dark' | 'system'}` — the stored preference, defaulting to `'system'` if nothing is stored. Does not resolve `'system'` to a concrete value — use the `data-theme` attribute on `<html>` if you need to know which colour is actually active.

### `onThemeChange(cb)`

**Parameters**
- `cb` `{(theme: string) => void}` — called whenever the theme changes, with the stored preference (not the resolved value)

**Returns** `{() => void}` — unsubscribe function. Call in your component's `unsubscribe()` method.

---

## Token system

All visual values — colours, spacing, typography, radii, shadows — are defined as CSS custom properties in `_lib/core/styles/tokens.css`. No component ever hardcodes a value that has a token equivalent.

To retheme an app, override two variables in your own stylesheet:

```css
:root {
  --color-accent:       #2D6BE4;   /* primary brand colour */
  --color-accent-light: #EAF0FD;   /* tinted backgrounds, badges */
}
```

Everything that uses accent — buttons, highlights, active states — updates automatically.

## Available tokens

### Colour

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F5F2EE` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, sheets |
| `--color-surface-raised` | `#EEEAE4` | Inset or secondary cards |
| `--color-border` | `#E4E0DA` | Dividers, input borders |
| `--color-text-primary` | `#1C1C1E` | Headings, primary data |
| `--color-text-secondary` | `#8A8A8E` | **Large text only** (18px+) — 2.85:1 contrast |
| `--color-text-muted` | `#AEAEB2` | **Decorative only** — 2.32:1 contrast, never actionable labels |
| `--color-text-inverse` | `#FFFFFF` | Text on dark surfaces |
| `--color-accent` | `#E8824A` | Override to retheme |
| `--color-accent-light` | `#FDF0E8` | Override to retheme |
| `--color-accent-dark` | `#C4622E` | Pressed states — derived, override if needed |

Semantic colours (`--color-success`, `--color-warning`, `--color-danger` and their `-light` variants) are always paired with a text label. Colour alone is never the only state indicator.

White text on `--color-accent` fails WCAG AA contrast. Use accent for icons and fills only, not text labels.

### Spacing

4px base grid. Use semantic aliases in components:

```css
padding: var(--space-md);    /* 16px */
gap:     var(--space-sm);    /*  8px */
margin-block-end: var(--space-lg);  /* 24px */
```

| Alias | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

### Touch targets

```css
min-block-size: var(--touch-target);     /* 40px — all interactive elements */
min-block-size: var(--touch-target-lg);  /* 52px — primary actions, nav items */
```

### Typography

```css
font-family:   var(--font-family);
font-size:     var(--font-size-body);      /* 16px */
font-weight:   var(--font-weight-medium);  /* 500 */
line-height:   var(--line-height-normal);  /* 1.5 */
```

## Animations

Import `_lib/core/styles/animations.css` only if your app uses motion. All animations respect `prefers-reduced-motion` — the file handles this globally.

```html
<link rel="stylesheet" href="/_lib/core/styles/animations.css" />
```

Apply animation classes directly to elements:

```js
// Page transition — add to the entering page element
el.classList.add('enter-slide-right');

// List items loading in
el.classList.add('enter-fade-up');

// Bottom sheet
sheet.classList.add('sheet-enter');
```

### Available classes

**Page transitions** (add/remove on navigation):
- `enter-slide-right` — new page enters from right (forward navigation)
- `exit-slide-left` — old page exits to left
- `enter-slide-left` — new page enters from left (back navigation)
- `exit-slide-right` — old page exits to right

**Element entrances**:
- `enter-fade-up` — fade up from 12px below (list items, cards)
- `stagger-children` — apply to parent; children stagger with `--i` index
- `enter-scale` — scale in from 94% (modals, cards appearing)

**Overlays**:
- `sheet-enter` / `sheet-exit` — bottom sheet slide up/down
- `backdrop-enter` / `backdrop-exit` — overlay fade

**Feedback**:
- `tap-feedback` — scale 0.97 on `:active`, tap highlight removed
- `success-flash` — brief green background flash on success

**Gesture patterns** (JS-driven via CSS custom properties):
- `drag-handle` — controlled by `--drag-x`
- `drag-fill` — progress fill, controlled by `--drag-progress`
- `swipe-row` — controlled by `--swipe-x`

### Duration and easing tokens

```css
transition: transform var(--duration-normal) var(--ease-out);
```

| Token | Value |
|---|---|
| `--duration-fast` | 120ms |
| `--duration-normal` | 220ms |
| `--duration-slow` | 380ms |
| `--duration-spring` | 480ms |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` |

---

[← Claude Code](claude.md) · [Docs](https://github.com/elforn/socle/blob/main/README.md#docs) · [Next: Accessibility →](a11y.md)
