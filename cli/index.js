#!/usr/bin/env node
import readline from 'readline';
import fs, { realpathSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { multiSelect } from './prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCAFFOLD_DIR = path.join(ROOT, 'scaffold');
const CORE_DIR = path.join(ROOT, 'core');
const MODULES_DIR = path.join(ROOT, 'modules');

const TEXT_EXTS = new Set(['.js', '.json', '.html', '.md', '.yml', '.yaml', '.css', '.txt', '.template']);

const MODULE_OPTIONS = [
  { label: 'Gesture library',      value: 'gestures' },
  { label: 'Sync (export/import)', value: 'sync' },
  { label: 'Image handling',       value: 'images' },
  { type: 'separator', label: 'UI' },
  { label: 'App header',           value: 'app-header' },
  { label: 'Modal dialog',         value: 'modal-dialog' },
  { label: 'Toast notifications',  value: 'toast' },
  { label: 'P2P sync',             value: 'p2p', disabled: true, hint: 'coming in V2' },
];

const VALID_MODULES = ['gestures', 'sync', 'images', 'app-header', 'modal-dialog', 'toast', 'ui', 'p2p'];

// ── pure helpers (exported for tests) ────────────────────────────────────────

export function replaceTokens(content, map) {
  return Object.entries(map).reduce((s, [k, v]) => s.replaceAll(`%%${k}%%`, v), content);
}

export function replaceBlockTokens(content, map) {
  return Object.entries(map).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), content);
}

function isTextFile(filepath) {
  return TEXT_EXTS.has(path.extname(filepath)) || path.basename(filepath) === '.gitignore';
}

function toTitleCase(str) {
  return str.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function walkText(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkText(full, fn);
    else if (isTextFile(full)) fn(full);
  }
}

function patchAccentColor(tokensPath, color) {
  const content = fs.readFileSync(tokensPath, 'utf8');
  fs.writeFileSync(tokensPath, content.replace(/--color-accent:\s*[^;]+;/, `--color-accent: ${color};`));
}

function readAccentColor(tokensPath) {
  if (!fs.existsSync(tokensPath)) return null;
  const m = fs.readFileSync(tokensPath, 'utf8').match(/--color-accent:\s*([^;]+);/);
  return m ? m[1].trim() : null;
}

export function findModuleImports(appDir, moduleName) {
  const pattern = `_lib/modules/${moduleName}/`;
  const results = [];
  if (!fs.existsSync(appDir)) return results;
  for (const entry of fs.readdirSync(appDir, { recursive: true })) {
    if (!entry.endsWith('.js')) continue;
    const full = path.join(appDir, entry);
    if (fs.statSync(full).isFile() && fs.readFileSync(full, 'utf8').includes(pattern)) {
      results.push(entry);
    }
  }
  return results;
}

// ── token value builders ──────────────────────────────────────────────────────

function buildTokenMap(options) {
  const {
    appName, appShortName, appDescription, githubUser, version, port,
    includeGestures, includeSync, includeImages,
    includeAppHeader, includeModal, includeToast,
  } = options;

  // HP_* tokens are placed FIRST so that any %%APP_NAME%% they contain
  // gets substituted when APP_NAME is processed in the same pass.
  const HP_TOAST_IMPORT = includeToast
    ? "import { toast } from '../../_lib/modules/toast/toast.js';"
    : '';

  const HP_GESTURE_IMPORT = includeGestures
    ? "import { Gestures } from '../../_lib/modules/gestures/gestures.js';"
    : '';

  const HP_GESTURE_CSS = includeGestures ? [
    '        .bar-wrapper {',
    '          block-size: 52px;',
    '          background: var(--color-border);',
    '          border-radius: var(--radius-md);',
    '          position: relative;',
    '          overflow: hidden;',
    '          cursor: grab;',
    '          user-select: none;',
    '          touch-action: none;',
    '        }',
    '        .bar-wrapper.hold-active { cursor: grabbing; }',
    '        .fill {',
    '          block-size: 100%;',
    '          inline-size: var(--pct, 0%);',
    '          background: var(--color-accent);',
    '          transition: inline-size 0.1s;',
    '          border-radius: var(--radius-md);',
    '        }',
    '        .bar-wrapper.hold-active .fill { transition: none; }',
    '        .pct-label {',
    '          position: absolute;',
    '          inset: 0;',
    '          display: flex;',
    '          align-items: center;',
    '          padding-inline: var(--space-3);',
    '          font-weight: var(--font-weight-bold);',
    '          color: var(--color-text-primary);',
    '          pointer-events: none;',
    '        }',
  ].join('\n') : '';

  const HP_MODAL_BTN = includeModal
    ? "            <button class=\"secondary\" id=\"modal-btn\">Info</button>"
    : '';

  const HP_MODAL_ELEMENT = includeModal ? [
    '',
    '        <modal-dialog id="demo-modal">',
    '          <p>Replace this modal with your app\'s content.</p>',
    '          <button slot="footer" class="primary" id="modal-close-btn">Close</button>',
    '        </modal-dialog>',
  ].join('\n') : '';

  const HP_GESTURE_SECTION = includeGestures ? [
    '',
    '        <section class="card">',
    '          <h2>Gesture demo</h2>',
    '          <p>Hold and drag the bar to adjust the value.</p>',
    '          <div class="bar-wrapper" id="gesture-bar">',
    '            <div class="fill" id="gesture-fill"></div>',
    '            <span class="pct-label" id="gesture-pct">0%</span>',
    '          </div>',
    '        </section>',
  ].join('\n') : '';

  const HP_SYNC_SECTION = includeSync ? [
    '',
    '        <section class="card">',
    '          <h2>Data sync</h2>',
    '          <p>Export your data for backup or to transfer to another device.</p>',
    '          <div class="actions">',
    '            <button class="secondary" id="export-btn">Export backup</button>',
    '            <button class="secondary" id="import-btn">Import</button>',
    '          </div>',
    '          <input type="file" accept=".json" id="sync-file-input" hidden />',
    '        </section>',
  ].join('\n') : '';

  const HP_TOAST_DISPATCH = includeToast
    ? "      toast('Entry saved', 'success');"
    : '';

  const HP_MODAL_SUBSCRIBE = includeModal ? [
    "    this._onModalOpen  = () => sr.querySelector('#demo-modal').show();",
    "    this._onModalClose = () => sr.querySelector('#demo-modal').close();",
    "    sr.querySelector('#modal-btn').addEventListener('click', this._onModalOpen);",
    "    sr.querySelector('#modal-close-btn').addEventListener('click', this._onModalClose);",
    '',
  ].join('\n') : '';

  const HP_MODAL_UNSUBSCRIBE = includeModal ? [
    "    sr.querySelector('#modal-btn')?.removeEventListener('click', this._onModalOpen);",
    "    sr.querySelector('#modal-close-btn')?.removeEventListener('click', this._onModalClose);",
  ].join('\n') : '';

  const HP_GESTURE_SUBSCRIBE = includeGestures ? [
    "    const _bar  = sr.querySelector('#gesture-bar');",
    "    const _fill = sr.querySelector('#gesture-fill');",
    "    const _lbl  = sr.querySelector('#gesture-pct');",
    "    this._gestureCleanup = Gestures.attach(_bar, {",
    "      onHoldDragStart: () => _bar.classList.add('hold-active'),",
    '      onHoldDrag: e => {',
    '        const rect = _bar.getBoundingClientRect();',
    '        const pct  = Math.round(Math.max(0, Math.min(100, (e.endX - rect.left) / rect.width * 100)));',
    "        _fill.style.setProperty('--pct', pct + '%');",
    "        _lbl.textContent = pct + '%';",
    '      },',
    "      onHoldDragEnd: () => _bar.classList.remove('hold-active'),",
    '      onHoldDragKey: dir => {',
    "        const cur = parseFloat(_fill.style.getPropertyValue('--pct') || '0');",
    "        const pct = Math.round(Math.max(0, Math.min(100, cur + (dir === 'right' ? 5 : -5))));",
    "        _fill.style.setProperty('--pct', pct + '%');",
    "        _lbl.textContent = pct + '%';",
    '      },',
    '    });',
    '',
  ].join('\n') : '';

  const HP_GESTURE_UNSUBSCRIBE = includeGestures
    ? "    this._gestureCleanup?.();"
    : '';

  const toastCall = includeToast ? "\n      toast('Backup ready', 'success');" : '';
  const toastImportCall = includeToast ? "\n      toast('Imported ' + result.eventsAdded + ' event' + (result.eventsAdded === 1 ? '' : 's'), 'success');" : '';
  const HP_SYNC_SUBSCRIBE = includeSync ? [
    '    this._onExport = async () => {',
    "      const { exportData, downloadExport } = await import('../../_lib/modules/sync/sync.js');",
    '      const data = await exportData();',
    "      downloadExport('%%APP_NAME%%-backup.json', data);" + toastCall,
    '    };',
    "    this._onImportClick = () => sr.querySelector('#sync-file-input').click();",
    '    this._onFileChange = async e => {',
    '      const file = e.target.files[0];',
    '      if (!file) return;',
    "      const { readImportFile, importData } = await import('../../_lib/modules/sync/sync.js');",
    '      const payload = await readImportFile(file);',
    '      const result  = await importData(payload);' + toastImportCall,
    "      e.target.value = '';",
    '    };',
    "    sr.querySelector('#export-btn').addEventListener('click', this._onExport);",
    "    sr.querySelector('#import-btn').addEventListener('click', this._onImportClick);",
    "    sr.querySelector('#sync-file-input').addEventListener('change', this._onFileChange);",
    '',
  ].join('\n') : '';

  const HP_SYNC_UNSUBSCRIBE = includeSync ? [
    "    sr.querySelector('#export-btn')?.removeEventListener('click', this._onExport);",
    "    sr.querySelector('#import-btn')?.removeEventListener('click', this._onImportClick);",
    "    sr.querySelector('#sync-file-input')?.removeEventListener('change', this._onFileChange);",
  ].join('\n') : '';

  const APP_HEADER_IMPORT = includeAppHeader
    ? "import '../_lib/modules/app-header/app-header.js';"
    : '';

  const MODAL_IMPORT = includeModal
    ? "import '../_lib/modules/modal-dialog/modal-dialog.js';"
    : '';

  const APP_HEADER_ELEMENT = includeAppHeader
    ? `<app-header>${appName}</app-header>`
    : '';

  return {
    // HP_* first so %%APP_NAME%% inside them is substituted by the APP_NAME pass
    HP_TOAST_IMPORT,
    HP_GESTURE_IMPORT,
    HP_GESTURE_CSS,
    HP_MODAL_BTN,
    HP_MODAL_ELEMENT,
    HP_GESTURE_SECTION,
    HP_SYNC_SECTION,
    HP_TOAST_DISPATCH,
    HP_MODAL_SUBSCRIBE,
    HP_MODAL_UNSUBSCRIBE,
    HP_GESTURE_SUBSCRIBE,
    HP_GESTURE_UNSUBSCRIBE,
    HP_SYNC_SUBSCRIBE,
    HP_SYNC_UNSUBSCRIBE,
    APP_HEADER_IMPORT,
    MODAL_IMPORT,
    APP_HEADER_ELEMENT,
    APP_NAME:        appName,
    APP_SHORT_NAME:  appShortName,
    APP_DESCRIPTION: appDescription,
    LANG:            'en',
    GITHUB_USER:     githubUser,
    PORT:            String(port),
    IMAGES_IMPORT:   includeImages ? "import './pages/images-page.js';" : '',
    IMAGES_ROUTE:    includeImages ? "  { path: '/images', component: 'images-page' }," : '',
  };
}

// ── scaffoldApp (exported for tests) ─────────────────────────────────────────

export function scaffoldApp(options, destDir) {
  const {
    appName, appShortName, appDescription, githubUser,
    includeSync = false, includeGestures = true, includeImages = false,
    includeAppHeader = false, includeModal = false, includeToast = false,
    accentColor, version, port = 3000,
  } = options;

  const resolvedOptions = {
    appName, appShortName, appDescription, githubUser, version, port,
    includeGestures, includeSync, includeImages,
    includeAppHeader, includeModal, includeToast,
  };

  // Copy scaffold base, excluding _modules/ (handled separately below)
  fs.cpSync(SCAFFOLD_DIR, destDir, {
    recursive: true,
    filter: src => {
      if (src.endsWith('.DS_Store')) return false;
      const rel = path.relative(SCAFFOLD_DIR, src);
      return !rel.startsWith('_modules');
    },
  });

  const tokenMap = buildTokenMap(resolvedOptions);

  walkText(destDir, file => {
    if (file.endsWith('CLAUDE.md.template')) return;
    const content = fs.readFileSync(file, 'utf8');
    const replaced = replaceTokens(content, tokenMap);
    if (replaced !== content) fs.writeFileSync(file, replaced);
  });

  const templatePath = path.join(destDir, 'CLAUDE.md.template');
  const modules = [
    'core',
    ...(includeGestures  ? ['gestures']     : []),
    ...(includeSync      ? ['sync']          : []),
    ...(includeImages    ? ['images']        : []),
    ...(includeAppHeader ? ['app-header']    : []),
    ...(includeModal     ? ['modal-dialog']  : []),
    ...(includeToast     ? ['toast']         : []),
  ];
  const blockMap = {
    APP_NAME:        appName,
    APP_DESCRIPTION: appDescription,
    LIB_VERSION:     version,
    SCAFFOLDED_DATE: new Date().toISOString().split('T')[0],
    MODULES:         modules.join(', '),
    ACCENT_COLOR:    accentColor,
  };
  fs.writeFileSync(
    path.join(destDir, 'CLAUDE.md'),
    replaceBlockTokens(fs.readFileSync(templatePath, 'utf8'), blockMap)
  );
  fs.rmSync(templatePath);

  // Copy optional module scaffold pages (images only; gesture/sync are inline in home-page)
  const modScaffoldImages = path.join(SCAFFOLD_DIR, '_modules', 'images');
  if (includeImages && fs.existsSync(modScaffoldImages)) {
    fs.cpSync(modScaffoldImages, destDir, { recursive: true });
    walkText(destDir, file => {
      const content = fs.readFileSync(file, 'utf8');
      const replaced = replaceTokens(content, tokenMap);
      if (replaced !== content) fs.writeFileSync(file, replaced);
    });
  }

  fs.mkdirSync(path.join(destDir, '_lib', 'modules'), { recursive: true });
  fs.cpSync(CORE_DIR, path.join(destDir, '_lib', 'core'), { recursive: true });
  if (includeGestures)  fs.cpSync(path.join(MODULES_DIR, 'gestures'),     path.join(destDir, '_lib', 'modules', 'gestures'),     { recursive: true });
  if (includeSync)      fs.cpSync(path.join(MODULES_DIR, 'sync'),         path.join(destDir, '_lib', 'modules', 'sync'),         { recursive: true });
  if (includeImages)    fs.cpSync(path.join(MODULES_DIR, 'images'),       path.join(destDir, '_lib', 'modules', 'images'),       { recursive: true });
  if (includeAppHeader) fs.cpSync(path.join(MODULES_DIR, 'app-header'),   path.join(destDir, '_lib', 'modules', 'app-header'),   { recursive: true });
  if (includeModal)     fs.cpSync(path.join(MODULES_DIR, 'modal-dialog'), path.join(destDir, '_lib', 'modules', 'modal-dialog'), { recursive: true });
  if (includeToast)     fs.cpSync(path.join(MODULES_DIR, 'toast'),        path.join(destDir, '_lib', 'modules', 'toast'),        { recursive: true });

  fs.writeFileSync(
    path.join(destDir, '_lib', 'lib-version.json'),
    JSON.stringify({ version, modules, scaffolded: new Date().toISOString().split('T')[0] }, null, 2) + '\n'
  );

  patchAccentColor(path.join(destDir, '_lib', 'core', 'styles', 'tokens.css'), accentColor);
}

// ── updateLib (exported for tests) ───────────────────────────────────────────

export async function updateLib(projectDir, ask) {
  const libVersionPath = path.join(projectDir, '_lib', 'lib-version.json');
  if (!fs.existsSync(libVersionPath)) {
    throw new Error('No _lib/lib-version.json found. Run this from a Socle project root.');
  }

  const current = JSON.parse(fs.readFileSync(libVersionPath, 'utf8'));
  const { version: latest } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  if (current.version === latest) {
    console.log(`Already up to date (${latest}).`);
    return;
  }

  console.log(`Socle update: ${current.version} → ${latest}`);

  try {
    const modified = execSync('git diff --name-only _lib/', { cwd: projectDir, stdio: ['pipe', 'pipe', 'pipe'] })
      .toString().trim();
    if (modified) {
      console.log('\nLocally modified _lib/ files:');
      modified.split('\n').forEach(f => console.log(`  ${f}`));
      const answer = await ask('\nThese will be overwritten. Continue? [y/N]: ');
      if (!answer.trim().toLowerCase().startsWith('y')) { console.log('Aborted.'); return; }
    }
  } catch { /* git unavailable or not a repo — skip check */ }

  const tokensPath = path.join(projectDir, '_lib', 'core', 'styles', 'tokens.css');
  const preservedAccent = readAccentColor(tokensPath);

  console.log('\nUpdating _lib/...');
  fs.rmSync(path.join(projectDir, '_lib', 'core'), { recursive: true, force: true });
  fs.cpSync(CORE_DIR, path.join(projectDir, '_lib', 'core'), { recursive: true });
  console.log('  ✔ _lib/core updated');

  for (const mod of current.modules.filter(m => m !== 'core')) {
    const modSrc = path.join(MODULES_DIR, mod);
    if (fs.existsSync(modSrc)) {
      fs.rmSync(path.join(projectDir, '_lib', 'modules', mod), { recursive: true, force: true });
      fs.cpSync(modSrc, path.join(projectDir, '_lib', 'modules', mod), { recursive: true });
      console.log(`  ✔ _lib/modules/${mod} updated`);
    }
  }

  if (preservedAccent) patchAccentColor(tokensPath, preservedAccent);

  fs.writeFileSync(libVersionPath, JSON.stringify({ ...current, version: latest }, null, 2) + '\n');
  console.log(`  ✔ lib-version.json updated to ${latest}`);

  console.log(`\nDone. Review the changelog, then commit:`);
  console.log(`  git add _lib/ && git commit -m "chore: update socle to ${latest}"`);
}

// ── addModule (exported for tests) ───────────────────────────────────────────

export function addModule(projectDir, moduleName) {
  if (!moduleName) throw new Error('Module name required. Usage: npx socle add <module>');
  if (!VALID_MODULES.includes(moduleName)) {
    throw new Error(`Unknown module: '${moduleName}'. Valid modules: ${VALID_MODULES.join(', ')}`);
  }

  const libVersionPath = path.join(projectDir, '_lib', 'lib-version.json');
  if (!fs.existsSync(libVersionPath)) {
    throw new Error('No _lib/lib-version.json found. Run this from a Socle project root.');
  }

  const meta = JSON.parse(fs.readFileSync(libVersionPath, 'utf8'));
  if (meta.modules.includes(moduleName)) {
    console.log(`Module '${moduleName}' is already installed.`);
    return;
  }

  const src = path.join(MODULES_DIR, moduleName);
  if (!fs.existsSync(src)) {
    throw new Error(`Module '${moduleName}' is not available in this version of Socle.`);
  }

  fs.mkdirSync(path.join(projectDir, '_lib', 'modules'), { recursive: true });
  fs.cpSync(src, path.join(projectDir, '_lib', 'modules', moduleName), { recursive: true });

  meta.modules.push(moduleName);
  fs.writeFileSync(libVersionPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`  ✔ Added: ${moduleName}`);
}

// ── removeModule (exported for tests) ────────────────────────────────────────

export async function removeModule(projectDir, moduleName, ask) {
  if (!moduleName) throw new Error('Module name required. Usage: npx socle remove <module>');
  if (moduleName === 'core') throw new Error("Cannot remove 'core' — it is always required.");
  if (!VALID_MODULES.includes(moduleName)) {
    throw new Error(`Unknown module: '${moduleName}'. Valid modules: ${VALID_MODULES.join(', ')}`);
  }

  const libVersionPath = path.join(projectDir, '_lib', 'lib-version.json');
  if (!fs.existsSync(libVersionPath)) {
    throw new Error('No _lib/lib-version.json found. Run this from a Socle project root.');
  }

  const meta = JSON.parse(fs.readFileSync(libVersionPath, 'utf8'));
  if (!meta.modules.includes(moduleName)) {
    console.log(`Module '${moduleName}' is not installed.`);
    return;
  }

  const usages = findModuleImports(path.join(projectDir, 'app'), moduleName);
  if (usages.length > 0) {
    console.log(`\nWarning: ${usages.length} file(s) in app/ import from '${moduleName}':`);
    usages.forEach(f => console.log(`  ${f}`));
    const answer = await ask('\nRemove anyway? [y/N]: ');
    if (!answer.trim().toLowerCase().startsWith('y')) { console.log('Aborted.'); return; }
  }

  fs.rmSync(path.join(projectDir, '_lib', 'modules', moduleName), { recursive: true, force: true });
  meta.modules = meta.modules.filter(m => m !== moduleName);
  fs.writeFileSync(libVersionPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`  ✔ Removed: ${moduleName}`);
}

// ── interactive runners ───────────────────────────────────────────────────────

function makeAsk(rl) {
  return q => new Promise(resolve => rl.question(q, resolve));
}

async function runScaffold(dirArg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = makeAsk(rl);

  let dirName = dirArg?.trim();
  if (!dirName) dirName = (await ask('App directory name: ')).trim();
  if (!dirName) { console.error('Directory name is required.'); rl.close(); process.exit(1); }

  const destDir = path.resolve(process.cwd(), dirName);
  if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    console.error(`Error: Directory '${dirName}' already exists and is not empty.`);
    rl.close();
    process.exit(1);
  }

  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  console.log(`\nWelcome to Socle ${version}`);
  console.log(`Creating a new app in ./${dirName}\n`);

  const defaultName    = toTitleCase(path.basename(destDir));
  const appName        = (await ask(`App name [${defaultName}]: `)).trim() || defaultName;
  const appShortName   = (await ask(`App short name [${appName}]: `)).trim() || appName;
  const appDescription = (await ask('App description [A PWA built with Socle]: ')).trim() || 'A PWA built with Socle';
  const githubUser     = (await ask('GitHub username [your-username]: ')).trim() || 'your-username';
  const accentColor    = (await ask('Accent color (hex) [#E8824A]: ')).trim() || '#E8824A';
  const portInput      = (await ask('Dev server port [3000]: ')).trim();
  const port           = portInput && /^\d+$/.test(portInput) ? parseInt(portInput, 10) : 3000;

  rl.close();

  const selectedModules = await multiSelect('Which modules do you need?', MODULE_OPTIONS, ['gestures', 'app-header', 'modal-dialog', 'toast']);

  console.log('\nScaffolding...');
  scaffoldApp({
    appName, appShortName, appDescription, githubUser, accentColor, version, port,
    includeGestures:  selectedModules.includes('gestures'),
    includeSync:      selectedModules.includes('sync'),
    includeImages:    selectedModules.includes('images'),
    includeAppHeader: selectedModules.includes('app-header'),
    includeModal:     selectedModules.includes('modal-dialog'),
    includeToast:     selectedModules.includes('toast'),
  }, destDir);

  console.log('  ✔ app/ structure created');
  console.log('  ✔ tests/ and utils/ copied');
  console.log('  ✔ index.html, manifest.json generated');
  console.log('  ✔ _lib/core copied');
  for (const mod of ['gestures', 'sync', 'images', 'app-header', 'modal-dialog', 'toast']) {
    if (selectedModules.includes(mod)) console.log(`  ✔ _lib/modules/${mod} copied`);
  }
  console.log('  ✔ _lib/lib-version.json written');
  console.log(`  ✔ Accent colour set to ${accentColor}`);
  console.log('  ✔ CLAUDE.md generated');

  console.log(`\nYour app is ready in ./${dirName}\n`);
  console.log('Next steps:');
  console.log(`  cd ${dirName}`);
  console.log('  npm install');
  console.log(`  git init && git add . && git commit -m "chore: scaffold from socle ${version}"`);
  console.log('  npm run build');
  console.log('  npm run serve');
}

async function runUpdate() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    await updateLib(process.cwd(), makeAsk(rl));
  } catch (e) {
    console.error(`Error: ${e.message}`);
    rl.close();
    process.exit(1);
  }
  rl.close();
}

async function runAdd(moduleName) {
  try {
    addModule(process.cwd(), moduleName);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

async function runRemove(moduleName) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    await removeModule(process.cwd(), moduleName, makeAsk(rl));
  } catch (e) {
    console.error(`Error: ${e.message}`);
    rl.close();
    process.exit(1);
  }
  rl.close();
}

async function runManage() {
  const libVersionPath = path.join(process.cwd(), '_lib', 'lib-version.json');
  if (!fs.existsSync(libVersionPath)) {
    console.error('Error: No _lib/lib-version.json found. Run this from a Socle project root.');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(libVersionPath, 'utf8'));
  const installed = new Set(meta.modules.filter(m => m !== 'core'));

  const before = [...installed];
  const after  = await multiSelect('Manage modules', MODULE_OPTIONS, before);

  const toAdd    = after.filter(m => !installed.has(m));
  const toRemove = before.filter(m => !after.includes(m));

  if (toAdd.length === 0 && toRemove.length === 0) {
    console.log('No changes.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for (const m of toAdd) {
    try { addModule(process.cwd(), m); } catch (e) { console.error(`Error: ${e.message}`); }
  }
  for (const m of toRemove) {
    try { await removeModule(process.cwd(), m, makeAsk(rl)); } catch (e) { console.error(`Error: ${e.message}`); }
  }
  rl.close();
}

// ── entry ─────────────────────────────────────────────────────────────────────

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [,, cmd, arg] = process.argv;
  let runner;
  if      (cmd === 'update') runner = runUpdate();
  else if (cmd === 'add')    runner = runAdd(arg);
  else if (cmd === 'remove') runner = runRemove(arg);
  else if (cmd === 'manage') runner = runManage();
  else                       runner = runScaffold(cmd);
  runner.catch(e => { console.error(e.message); process.exit(1); });
}
