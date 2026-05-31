import readline from 'readline';

// ANSI helpers
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const CYAN  = '\x1b[36m';

function isSkeleton(item) { return item.type === 'separator' || item.disabled; }

// ── multiSelect ──────────────────────────────────────────────────────────────

export async function multiSelect(title, items, defaultSelected = []) {
  if (!process.stdin.isTTY) return fallbackMultiSelect(title, items, defaultSelected);

  const selected = new Set(
    defaultSelected.length ? defaultSelected : items.filter(i => !i.disabled && i.type !== 'separator').slice(0, 1).map(i => i.value)
  );
  let cursor = items.findIndex(i => !i.disabled && i.type !== 'separator');

  function render() {
    let out = `${BOLD}? ${title}${RESET}  ${DIM}↑↓ move · Space toggle · Enter confirm${RESET}\n`;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const active = i === cursor;
      const prefix = active ? `${CYAN}›${RESET}` : ' ';
      if (item.type === 'separator') {
        out += `  ${DIM}${BOLD}${item.label}${RESET}\n`;
      } else if (item.disabled) {
        out += `${prefix} ${DIM}— ${item.label}${item.hint ? `  ${item.hint}` : ''}${RESET}\n`;
      } else {
        const check = selected.has(item.value) ? `${CYAN}✔${RESET}` : '◯';
        out += `${prefix} ${check} ${active ? BOLD : ''}${item.label}${RESET}\n`;
      }
    }
    return out;
  }

  process.stdout.write('\n' + render());
  const lineCount = items.length + 2; // title line + N item lines + leading \n from write

  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function redraw() {
      readline.moveCursor(process.stdout, 0, -lineCount);
      readline.clearScreenDown(process.stdout);
      process.stdout.write('\n' + render());
    }

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onKey);
      process.stdout.write('\n');
    }

    function onKey(key) {
      if (key === '\x03') { cleanup(); process.exit(1); }

      if (key === '\x1b[A') { // up
        let i = cursor;
        do { i = (i - 1 + items.length) % items.length; } while (isSkeleton(items[i]) && i !== cursor);
        cursor = i;
        redraw();
      } else if (key === '\x1b[B') { // down
        let i = cursor;
        do { i = (i + 1) % items.length; } while (isSkeleton(items[i]) && i !== cursor);
        cursor = i;
        redraw();
      } else if (key === ' ') {
        const item = items[cursor];
        if (!item.disabled && item.type !== 'separator') {
          if (selected.has(item.value)) selected.delete(item.value);
          else selected.add(item.value);
          redraw();
        }
      } else if (key === '\r' || key === '\n') {
        cleanup();
        resolve([...selected]);
      }
    }

    process.stdin.on('data', onKey);
  });
}

// ── singleSelect ─────────────────────────────────────────────────────────────

export async function singleSelect(title, items) {
  if (!process.stdin.isTTY) return fallbackSingleSelect(title, items);

  let cursor = items.findIndex(i => !i.disabled && i.type !== 'separator');

  function render() {
    let out = `${BOLD}? ${title}${RESET}  ${DIM}↑↓ move · Enter confirm${RESET}\n`;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const active = i === cursor;
      const prefix = active ? `${CYAN}›${RESET}` : ' ';
      if (item.type === 'separator') {
        out += `  ${DIM}${BOLD}${item.label}${RESET}\n`;
      } else if (item.disabled) {
        out += `${prefix} ${DIM}— ${item.label}${item.hint ? `  ${item.hint}` : ''}${RESET}\n`;
      } else {
        const dot = active ? `${CYAN}●${RESET}` : '○';
        out += `${prefix} ${dot} ${active ? BOLD : ''}${item.label}${RESET}\n`;
      }
    }
    return out;
  }

  process.stdout.write('\n' + render());
  const lineCount = items.length + 2; // title line + N item lines + leading \n from write

  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function redraw() {
      readline.moveCursor(process.stdout, 0, -lineCount);
      readline.clearScreenDown(process.stdout);
      process.stdout.write('\n' + render());
    }

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onKey);
      process.stdout.write('\n');
    }

    function onKey(key) {
      if (key === '\x03') { cleanup(); process.exit(1); }

      if (key === '\x1b[A') {
        let i = cursor;
        do { i = (i - 1 + items.length) % items.length; } while (isSkeleton(items[i]) && i !== cursor);
        cursor = i; redraw();
      } else if (key === '\x1b[B') {
        let i = cursor;
        do { i = (i + 1) % items.length; } while (isSkeleton(items[i]) && i !== cursor);
        cursor = i; redraw();
      } else if (key === '\r' || key === '\n') {
        cleanup();
        resolve(items[cursor].value);
      }
    }

    process.stdin.on('data', onKey);
  });
}

// ── TTY fallbacks ─────────────────────────────────────────────────────────────

async function fallbackMultiSelect(title, items, defaultSelected) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(res => rl.question(q, res));
  const selected = new Set(defaultSelected);
  console.log(`\n${title}`);
  for (const item of items) {
    if (item.type === 'separator') { console.log(`\n  ${item.label}`); continue; }
    if (item.disabled) { console.log(`  — ${item.label}${item.hint ? `  (${item.hint})` : ''}`); continue; }
    const def = selected.has(item.value) ? 'Y/n' : 'y/N';
    const ans = await ask(`  Include ${item.label}? (${def}) `);
    const yes = ans.trim() === '' ? selected.has(item.value) : /^y/i.test(ans);
    if (yes) selected.add(item.value); else selected.delete(item.value);
  }
  rl.close();
  return [...selected];
}

async function fallbackSingleSelect(title, items) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(res => rl.question(q, res));
  const active = items.filter(i => !i.disabled && i.type !== 'separator');
  console.log(`\n${title}`);
  active.forEach((item, i) => console.log(`  ${i + 1}. ${item.label}`));
  const ans = await ask(`  Enter number (1-${active.length}): `);
  rl.close();
  const idx = parseInt(ans, 10) - 1;
  return active[Math.max(0, Math.min(active.length - 1, idx || 0))].value;
}
