/**
 * Scaffold token completeness tests — library developer tests only.
 *
 * Verifies that required %%TOKEN%% placeholders exist in the scaffold files
 * that need them. Prevents hardcoded values from slipping through port work
 * and shipping in generated apps.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const scaffold = join(dirname(fileURLToPath(import.meta.url)), '..', 'scaffold');

function read(...parts) { return readFileSync(join(scaffold, ...parts), 'utf8'); }
function has(file, token) { return read(...file.split('/')).includes(token); }

const REQUIRED = [
  // [file,                   token]
  ['index.html',              '%%LANG%%'],
  ['index.html',              '%%APP_NAME%%'],
  ['index.html',              '%%MAIN_JS%%'],
  ['index.html',              '%%APP_HEADER_ELEMENT%%'],
  ['manifest.json',           '%%APP_NAME%%'],
  ['manifest.json',           '%%APP_SHORT_NAME%%'],
  ['manifest.json',           '%%APP_DESCRIPTION%%'],
  ['manifest.json',           '%%LANG%%'],
  ['manifest.json',           '%%BASE_PATH%%'],
  ['package.json',            '%%APP_NAME%%'],
  ['package.json',            '%%PORT%%'],
  ['app/main.js',             '%%APP_NAME%%'],
  ['app/main.js',             '%%APP_HEADER_IMPORT%%'],
  ['app/main.js',             '%%MODAL_IMPORT%%'],
  ['app/main.js',             '%%IMAGES_IMPORT%%'],
  ['app/main.js',             '%%IMAGES_ROUTE%%'],
  ['app/pages/home-page.js',  '%%APP_NAME%%'],
  ['app/pages/home-page.js',  '%%HP_TOAST_IMPORT%%'],
  ['app/pages/home-page.js',  '%%HP_GESTURE_IMPORT%%'],
  ['app/pages/home-page.js',  '%%HP_GESTURE_CSS%%'],
  ['app/pages/home-page.js',  '%%HP_MODAL_BTN%%'],
  ['app/pages/home-page.js',  '%%HP_MODAL_ELEMENT%%'],
  ['app/pages/home-page.js',  '%%HP_GESTURE_SECTION%%'],
  ['app/pages/home-page.js',  '%%HP_SYNC_SECTION%%'],
  ['app/pages/home-page.js',  '%%HP_TOAST_DISPATCH%%'],
  ['app/pages/home-page.js',  '%%HP_MODAL_SUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_MODAL_UNSUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_GESTURE_SUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_GESTURE_UNSUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_SYNC_SUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_SYNC_UNSUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_IMAGES_IMPORT%%'],
  ['app/pages/home-page.js',  '%%HP_IMAGES_CSS%%'],
  ['app/pages/home-page.js',  '%%HP_IMAGES_SECTION%%'],
  ['app/pages/home-page.js',  '%%HP_IMAGES_SUBSCRIBE%%'],
  ['app/pages/home-page.js',  '%%HP_IMAGES_UNSUBSCRIBE%%'],
];

describe('scaffold %%TOKEN%% completeness', () => {
  for (const [file, token] of REQUIRED) {
    it(`${file} contains ${token}`, () => {
      expect(has(file, token), `${token} missing from scaffold/${file}`).toBe(true);
    });
  }
});
