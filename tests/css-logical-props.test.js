/**
 * CSS logical properties enforcement — library developer tests only.
 *
 * CLAUDE.md mandates CSS logical properties throughout _lib/ for RTL readiness.
 * This test catches directional property violations before they ship.
 * Allowed: margin-inline-start, padding-block, border-inline-end, inset-inline, etc.
 * Forbidden: margin-left/right, padding-top/bottom (when used as directional layout),
 *            border-left/right, float, text-align: left/right.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Patterns that indicate a directional CSS property.
// Match as property declarations: property-name followed by optional whitespace and colon.
const FORBIDDEN = [
  /\bmargin-left\s*:/,
  /\bmargin-right\s*:/,
  /\bpadding-left\s*:/,
  /\bpadding-right\s*:/,
  /\bborder-left\s*:/,
  /\bborder-right\s*:/,
  /\bfloat\s*:\s*(left|right)/,
  /\btext-align\s*:\s*(left|right)/,
];

function checkFile(filepath, src) {
  const violations = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of FORBIDDEN) {
      if (pattern.test(lines[i])) {
        violations.push(`${filepath}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }
  return violations;
}

describe('CSS logical properties in core/styles/', () => {
  const stylesDir = join(root, 'core', 'styles');

  it('tokens.css uses no directional properties', () => {
    const src = readFileSync(join(stylesDir, 'tokens.css'), 'utf8');
    const v = checkFile('core/styles/tokens.css', src);
    expect(v, v.join('\n')).toHaveLength(0);
  });

  it('base.js uses no directional properties in its CSS string', () => {
    const src = readFileSync(join(stylesDir, 'base.js'), 'utf8');
    const v = checkFile('core/styles/base.js', src);
    expect(v, v.join('\n')).toHaveLength(0);
  });
});
