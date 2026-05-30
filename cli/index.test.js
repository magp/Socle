import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { replaceTokens, replaceBlockTokens, scaffoldApp, updateLib } from './index.js';

// ── unit: replaceTokens ───────────────────────────────────────────────────────

describe('replaceTokens', () => {
  it('substitutes known tokens', () => {
    const result = replaceTokens('Hello %%APP_NAME%%!', { APP_NAME: 'My App' });
    expect(result).toBe('Hello My App!');
  });

  it('substitutes multiple tokens', () => {
    const result = replaceTokens('%%APP_NAME%% — %%APP_SHORT_NAME%%', {
      APP_NAME: 'My App',
      APP_SHORT_NAME: 'App',
    });
    expect(result).toBe('My App — App');
  });

  it('leaves build-time tokens untouched', () => {
    const content = 'src="%%MAIN_JS%%" base="%%BASE_PATH%%"';
    expect(replaceTokens(content, { APP_NAME: 'x' })).toBe(content);
  });

  it('replaces all occurrences', () => {
    const result = replaceTokens('%%APP_NAME%% and %%APP_NAME%%', { APP_NAME: 'Socle' });
    expect(result).toBe('Socle and Socle');
  });
});

// ── unit: replaceBlockTokens ──────────────────────────────────────────────────

describe('replaceBlockTokens', () => {
  it('substitutes {{TOKEN}} patterns', () => {
    const result = replaceBlockTokens('# {{APP_NAME}}\n{{APP_DESCRIPTION}}', {
      APP_NAME: 'My App',
      APP_DESCRIPTION: 'A cool app',
    });
    expect(result).toBe('# My App\nA cool app');
  });

  it('leaves unrecognised block tokens untouched', () => {
    const content = '{{UNKNOWN}}';
    expect(replaceBlockTokens(content, {})).toBe(content);
  });
});

// ── integration: scaffoldApp ──────────────────────────────────────────────────

const tmpDirs = [];

function makeTmpDir() {
  const dir = mkdtempSync(join(os.tmpdir(), 'socle-test-'));
  tmpDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
});

const BASE_OPTIONS = {
  appName: 'Test App',
  appShortName: 'Test',
  appDescription: 'A test application',
  githubUser: 'testuser',
  includeSync: false,
  accentColor: '#FF0000',
  version: '0.1.0',
};

describe('scaffoldApp', () => {
  it('creates the expected directory structure', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    expect(existsSync(join(dest, 'index.html'))).toBe(true);
    expect(existsSync(join(dest, 'manifest.json'))).toBe(true);
    expect(existsSync(join(dest, 'package.json'))).toBe(true);
    expect(existsSync(join(dest, 'app', 'main.js'))).toBe(true);
    expect(existsSync(join(dest, '_lib', 'core', 'app-element.js'))).toBe(true);
    expect(existsSync(join(dest, '_lib', 'modules', 'gestures', 'gestures.js'))).toBe(true);
  });

  it('replaces all %%APP_NAME%% tokens in output files', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    const filesToCheck = [
      join(dest, 'index.html'),
      join(dest, 'manifest.json'),
      join(dest, 'package.json'),
      join(dest, 'app', 'main.js'),
      join(dest, 'app', 'pages', 'home-page.js'),
    ];

    for (const file of filesToCheck) {
      expect(readFileSync(file, 'utf8'), `${file} still has %%APP_NAME%%`).not.toContain('%%APP_NAME%%');
    }
  });

  it('replaces all user-supplied tokens in manifest.json', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);
    const manifest = readFileSync(join(dest, 'manifest.json'), 'utf8');
    expect(manifest).not.toContain('%%APP_SHORT_NAME%%');
    expect(manifest).not.toContain('%%APP_DESCRIPTION%%');
    expect(manifest).not.toContain('%%LANG%%');
    expect(manifest).toContain('Test App');
    expect(manifest).toContain('Test');
    expect(manifest).toContain('A test application');
  });

  it('replaces %%LANG%% in index.html', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);
    const html = readFileSync(join(dest, 'index.html'), 'utf8');
    expect(html).not.toContain('%%LANG%%');
    expect(html).toContain('lang="en"');
  });

  it('leaves build-time tokens in place', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);
    expect(readFileSync(join(dest, 'index.html'), 'utf8')).toContain('%%MAIN_JS%%');
    expect(readFileSync(join(dest, 'manifest.json'), 'utf8')).toContain('%%BASE_PATH%%');
  });

  it('writes correct lib-version.json', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    const lv = JSON.parse(readFileSync(join(dest, '_lib', 'lib-version.json'), 'utf8'));
    expect(lv.version).toBe('0.1.0');
    expect(lv.modules).toEqual(['core', 'gestures']);
    expect(lv.scaffolded).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('generates CLAUDE.md and removes the template', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    expect(existsSync(join(dest, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dest, 'CLAUDE.md.template'))).toBe(false);

    const claude = readFileSync(join(dest, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('Test App');
    expect(claude).toContain('A test application');
    expect(claude).toContain('0.1.0');
    expect(claude).toContain('core, gestures');
    expect(claude).not.toContain('{{APP_NAME}}');
  });

  it('patches --color-accent in tokens.css', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    const css = readFileSync(join(dest, '_lib', 'core', 'styles', 'tokens.css'), 'utf8');
    expect(css).toContain('--color-accent: #FF0000;');
  });

  it('does not copy sync module when includeSync is false', () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);
    expect(existsSync(join(dest, '_lib', 'modules', 'sync'))).toBe(false);
  });

  it('copies sync module when includeSync is true', () => {
    const dest = makeTmpDir();
    scaffoldApp({ ...BASE_OPTIONS, includeSync: true }, dest);
    expect(existsSync(join(dest, '_lib', 'modules', 'sync', 'sync.js'))).toBe(true);

    const lv = JSON.parse(readFileSync(join(dest, '_lib', 'lib-version.json'), 'utf8'));
    expect(lv.modules).toContain('sync');
  });
});

// ── integration: updateLib ────────────────────────────────────────────────────

describe('updateLib', () => {
  it('throws when _lib/lib-version.json is missing', async () => {
    const dest = makeTmpDir();
    await expect(updateLib(dest, () => Promise.resolve('y')))
      .rejects.toThrow('No _lib/lib-version.json found');
  });

  it('reports already up to date when versions match', async () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    // Set lib-version to the current monorepo version
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
    const lvPath = join(dest, '_lib', 'lib-version.json');
    const lv = JSON.parse(readFileSync(lvPath, 'utf8'));
    lv.version = version;
    writeFileSync(lvPath, JSON.stringify(lv, null, 2));

    let logged = '';
    const orig = console.log;
    console.log = s => { logged += s + '\n'; };
    await updateLib(dest, () => Promise.resolve('y'));
    console.log = orig;

    expect(logged).toContain('Already up to date');
  });

  it('updates _lib/ and rewrites lib-version.json when outdated', async () => {
    const dest = makeTmpDir();
    scaffoldApp(BASE_OPTIONS, dest);

    // Force an old version so the update triggers
    const lvPath = join(dest, '_lib', 'lib-version.json');
    const lv = JSON.parse(readFileSync(lvPath, 'utf8'));
    lv.version = '0.0.1';
    writeFileSync(lvPath, JSON.stringify(lv, null, 2));

    await updateLib(dest, () => Promise.resolve('y'));

    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
    const updated = JSON.parse(readFileSync(lvPath, 'utf8'));
    expect(updated.version).toBe(version);
  });

  it('preserves accent color across update', async () => {
    const dest = makeTmpDir();
    scaffoldApp({ ...BASE_OPTIONS, accentColor: '#ABCDEF' }, dest);

    const lvPath = join(dest, '_lib', 'lib-version.json');
    const lv = JSON.parse(readFileSync(lvPath, 'utf8'));
    lv.version = '0.0.1';
    writeFileSync(lvPath, JSON.stringify(lv, null, 2));

    await updateLib(dest, () => Promise.resolve('y'));

    const css = readFileSync(join(dest, '_lib', 'core', 'styles', 'tokens.css'), 'utf8');
    expect(css).toContain('--color-accent: #ABCDEF;');
  });
});
